import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { bookingSchema, orderSchema } from "./validation";
import { scheduleTimes, serviceQuote, slotStarts, startAt } from "./schedule";
import { newPetCode } from "./pet-code";
import { syncCustomer, verifiedGuardian } from "./customer-core";
import { queueBookingNotices } from "./booking-notifications";
export class UserError extends Error {}
export const reference = (prefix: string) => prefix + "-" + randomBytes(4).toString("hex").toUpperCase();

export async function availableTimes(serviceId: string, date: string, size?: string) {
  const service = await db.service.findFirst({ where: { id: serviceId, active: true } });
  if (!service) return [];
  const { duration } = serviceQuote(service, size);
  const candidates = scheduleTimes(date, duration, service.kind);
  if (!candidates.length) return [];
  const resources = await db.resource.findMany({ where: { kind: service.kind } });
  if (!resources.some(r => r.active)) return [];
  const slots = await db.slot.findMany({ where: { resourceId: { in: resources.map(r => r.id) }, startAt: { gte: startAt(date, "00:00"), lt: startAt(date, "23:59") } } });
  return candidates.filter(time => slotStarts(startAt(date, time), duration).every(s => !slots.some(t => t.startAt.getTime() === s.getTime())));
}

export async function createBooking(raw: unknown, context: { userId?: string } = {}) {
  const input = bookingSchema.parse(raw);
  const requestHash = createHash("sha256").update(JSON.stringify({ input, userId: context.userId || null })).digest("hex");
  const existing = await db.appointment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) {
    if (existing.requestHash !== requestHash) throw new UserError("La solicitud cambió. Revisa los datos y vuelve a intentarlo.");
    return existing;
  }
  const service = await db.service.findFirst({ where: { id: input.serviceId, active: true } });
  if (!service) throw new UserError("Este servicio ya no está disponible.");
  const quote = serviceQuote(service, input.size);
  if (!scheduleTimes(input.date, quote.duration, service.kind).includes(input.time)) throw new UserError("Elige un horario disponible dentro de los próximos 30 días.");
  const start = startAt(input.date, input.time);
  const starts = slotStarts(start, quote.duration);
  // One concurrent appointment per area, independent of the other area's agenda.
  // Always use the same canonical active resource so the database unique slot lock
  // also protects concurrent requests; include historical resources in busy checks.
  const resources = await db.resource.findMany({ where: { kind: service.kind }, orderBy: { id: "asc" } });
  const resource = resources.find(r => r.active);
  if (!resource) throw new UserError("No hay disponibilidad para este servicio.");
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await db.$transaction(async tx => {
        const occupied = await tx.slot.count({ where: { resourceId: { in: resources.map(r => r.id) }, startAt: { in: starts } } });
        if (occupied) throw new UserError("Ese horario se acaba de ocupar. Selecciona otro para continuar.");
        const customer = context.userId ? await syncCustomer(tx, context.userId) : await tx.customer.upsert({ where: { email: input.customer.email }, create: input.customer, update: {} });
        let pet;
        if (input.petId) {
          if (!context.userId) throw new UserError("Inicia sesión para seleccionar una mascota registrada.");
          await verifiedGuardian(tx, context.userId, input.petId);
          pet = await tx.pet.findUniqueOrThrow({ where: { id: input.petId } });
        } else {
          pet = await tx.pet.create({ data: { name: input.petName, code: newPetCode(), species: input.species, size: input.size, coat: input.coat, customerId: customer.id, guardians: { create: { customerId: customer.id, source: "BOOKING" } } } });
        }
        if (service.kind === "GROOMING" && (pet.species !== "DOG" || !input.size || !input.coat)) throw new UserError("Selecciona tamaño y pelaje para la peluquería canina.");
        const contact = context.userId ? { name: [customer.name, customer.lastName].filter(Boolean).join(" "), email: customer.email, phone: customer.phone } : input.customer;
        const appointment = await tx.appointment.create({ data: {
          reference: reference("MIL"), idempotencyKey: input.idempotencyKey, requestHash,
          contactName: contact.name, contactEmail: contact.email, contactPhone: contact.phone,
          date: input.date, time: input.time, startAt: start,
          endAt: new Date(start.getTime() + quote.duration * 60000), price: quote.price, status: "CONFIRMED",
          notes: input.notes, serviceId: service.id, resourceId: resource.id, customerId: customer.id, petId: pet.id,
          slots: { create: starts.map(s => ({ resourceId: resource.id, startAt: s })) },
        } });
        await queueBookingNotices(tx, appointment.id, "CREATED");
        return appointment;
      });
    } catch (error) {
      if (error instanceof UserError) {
        const retry = await db.appointment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (retry && retry.requestHash === requestHash) return retry;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code)) {
        const retry = await db.appointment.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
        if (retry && retry.requestHash === requestHash) return retry;
        if (attempt < 3) continue;
        throw new UserError("Ese horario se acaba de ocupar. Selecciona otro para continuar.");
      }
      throw error;
    }
  }
  throw new UserError("Ese horario se acaba de ocupar. Selecciona otro para continuar.");
}

export async function createOrder(raw: unknown) {
  const input = orderSchema.parse(raw);
  const quantities = new Map<string, number>();
  for (const item of input.items) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  if ([...quantities.values()].some(q => q > 20)) throw new UserError("Máximo 20 unidades por producto.");
  return db.$transaction(async tx => {
    const existing = await tx.order.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
    const products = await tx.product.findMany({ where: { id: { in: [...quantities.keys()] }, active: true } });
    if (products.length !== quantities.size) throw new UserError("Un producto ya no está disponible.");
    for (const product of products) {
      const quantity = quantities.get(product.id)!;
      const result = await tx.product.updateMany({ where: { id: product.id, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
      if (!result.count) throw new UserError("No queda suficiente stock de " + product.name + ". Actualiza tu carrito.");
    }
    const customer = await tx.customer.upsert({ where: { email: input.customer.email }, create: input.customer, update: {} });
    return tx.order.create({ data: {
      reference: reference("PED"), idempotencyKey: input.idempotencyKey, customerId: customer.id,
      total: products.reduce((sum, p) => sum + p.price * quantities.get(p.id)!, 0),
      items: { create: products.map(p => ({ productId: p.id, quantity: quantities.get(p.id)!, price: p.price })) },
    } });
  });
}

export async function rescheduleBooking(id: string, date: string, time: string) {
  const current = await db.appointment.findUniqueOrThrow({ where: { id }, include: { service: true } });
  if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(current.status)) throw new UserError("Esta cita está finalizada.");
  const duration = current.service.kind === "VET" ? 30 : Math.round((current.endAt.getTime() - current.startAt.getTime()) / 60000);
  if (!scheduleTimes(date, duration, current.service.kind).includes(time)) throw new UserError("Horario fuera de disponibilidad.");
  const start = startAt(date, time), starts = slotStarts(start, duration);
  const resources = await db.resource.findMany({ where: { kind: current.service.kind }, orderBy: { id: "asc" } });
  const resource = resources.find(r => r.active);
  if (!resource) throw new UserError("No hay disponibilidad.");
  await db.$transaction(async tx => {
    const latest = await tx.appointment.findUniqueOrThrow({ where: { id } });
    if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(latest.status)) throw new UserError("Esta cita está finalizada.");
    if (latest.date === date && latest.time === time) return;
    const occupied = await tx.slot.count({ where: { resourceId: { in: resources.map(r => r.id) }, appointmentId: { not: id }, startAt: { in: starts } } });
    if (occupied) throw new UserError("Ese horario ya está ocupado.");
    await tx.slot.deleteMany({ where: { appointmentId: id } });
    await tx.appointment.update({ where: { id }, data: { date, time, startAt: start, endAt: new Date(start.getTime() + duration * 60000), resourceId: resource.id, status: "CONFIRMED", slots: { create: starts.map(s => ({ resourceId: resource.id, startAt: s })) } } });
    await queueBookingNotices(tx, id, "RESCHEDULED");
  });
}
export async function setBookingStatus(id: string, status: string) {
  const allowed = ["PENDING", "CONFIRMED", "ARRIVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"];
  if (!allowed.includes(status)) throw new UserError("Estado no válido.");
  await db.$transaction(async tx => {
    const appointment = await tx.appointment.findUniqueOrThrow({ where: { id } });
    if (appointment.status === status) return;
    if (["CANCELLED", "NO_SHOW", "COMPLETED"].includes(appointment.status)) throw new UserError("Una cita finalizada no puede reabrirse. Crea una nueva.");
    await tx.appointment.update({ where: { id }, data: { status } });
    if (["CANCELLED", "NO_SHOW"].includes(status)) await tx.slot.deleteMany({ where: { appointmentId: id } });
    await queueBookingNotices(tx, id, "UPDATED");
  });
}
