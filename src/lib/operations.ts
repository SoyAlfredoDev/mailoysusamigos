import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { db } from "./db";
import { bookingSchema, orderSchema } from "./validation";
import { scheduleTimes, serviceQuote, slotStarts, startAt } from "./schedule";
export class UserError extends Error {}
export const reference = (prefix: string) => prefix + "-" + randomBytes(4).toString("hex").toUpperCase();

export async function availableTimes(serviceId: string, date: string, size?: string) {
  const service = await db.service.findFirst({ where: { id: serviceId, active: true } });
  if (!service) return [];
  const { duration } = serviceQuote(service, size);
  const resources = await db.resource.findMany({ where: { kind: service.kind, active: true } });
  const slots = await db.slot.findMany({
    where: { resourceId: { in: resources.map(r => r.id) }, startAt: { gte: startAt(date, "00:00"), lt: startAt(date, "23:59") } },
  });
  return scheduleTimes(date, duration).filter(time => {
    const starts = slotStarts(startAt(date, time), duration);
    return resources.some(resource => starts.every(s => !slots.some(t => t.resourceId === resource.id && t.startAt.getTime() === s.getTime())));
  });
}

export async function createBooking(raw: unknown) {
  const input = bookingSchema.parse(raw);
  const service = await db.service.findFirst({ where: { id: input.serviceId, active: true } });
  if (!service) throw new UserError("Este servicio ya no está disponible.");
  if (service.kind === "GROOMING" && (input.species !== "DOG" || !input.size || !input.coat)) throw new UserError("Selecciona tamaño y pelaje para la peluquería canina.");
  const quote = serviceQuote(service, input.size);
  if (!scheduleTimes(input.date, quote.duration).includes(input.time)) throw new UserError("Elige un horario disponible dentro de los próximos 30 días.");
  const start = startAt(input.date, input.time);
  const starts = slotStarts(start, quote.duration);
  const resources = await db.resource.findMany({ where: { kind: service.kind, active: true } });
  for (const resource of resources) {
    try {
      return await db.$transaction(async tx => {
        const occupied = await tx.slot.count({ where: { resourceId: resource.id, startAt: { in: starts } } });
        if (occupied) return null;
        const customer = await tx.customer.upsert({
          where: { email: input.customer.email }, create: input.customer, update: {},
        });
        const pet = await tx.pet.create({ data: { name: input.petName, species: input.species, size: input.size, coat: input.coat, customerId: customer.id } });
        return tx.appointment.create({ data: {
          reference: reference("MIL"), date: input.date, time: input.time, startAt: start,
          endAt: new Date(start.getTime() + quote.duration * 60000), price: quote.price,
          notes: input.notes, serviceId: service.id, resourceId: resource.id, customerId: customer.id, petId: pet.id,
          slots: { create: starts.map(s => ({ resourceId: resource.id, startAt: s })) },
        } });
      }).then(result => { if (!result) throw new UserError("OCCUPIED"); return result; });
    } catch (error) {
      if ((error instanceof UserError && error.message === "OCCUPIED") || (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code))) continue;
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
