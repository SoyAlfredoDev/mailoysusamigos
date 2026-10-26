"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { scheduleTimes, slotStarts, startAt } from "@/lib/schedule";
export async function rescheduleAppointment(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(form.get("date"));
  const time = z.string().regex(/^\d{2}:\d{2}$/).parse(form.get("time"));
  const current = await db.appointment.findUniqueOrThrow({ where: { id }, include: { service: true } });
  if (["CANCELLED","NO_SHOW","COMPLETED"].includes(current.status)) throw new Error("Esta cita está finalizada.");
  const duration = Math.round((current.endAt.getTime()-current.startAt.getTime())/60000);
  if (!scheduleTimes(date,duration).includes(time)) throw new Error("Horario fuera de disponibilidad.");
  const start = startAt(date,time);
  const resources = await db.resource.findMany({ where: { kind: current.service.kind, active: true } });
  let saved = false;
  for (const r of resources) {
    try {
      await db.$transaction(async tx => {
        await tx.slot.deleteMany({ where: { appointmentId:id } });
        const occupied = await tx.slot.count({ where: { resourceId:r.id,startAt:{ in:slotStarts(start,duration) } } });
        if (occupied) throw new Error("Ocupado");
        await tx.appointment.update({ where:{id}, data:{date,time,startAt:start,endAt:new Date(start.getTime()+duration*60000),resourceId:r.id,status:"PENDING",slots:{create:slotStarts(start,duration).map(s=>({resourceId:r.id,startAt:s}))}} });
      });
      saved = true; break;
    } catch { continue; }
  }
  if (!saved) throw new Error("No hay disponibilidad.");
  revalidatePath("/admin");
}
export async function updateService(form: FormData) {
  await requireAdmin();
  const data=z.object({id:z.string(),price:z.coerce.number().int().min(100).max(1000000),duration:z.coerce.number().int().min(30).max(180).refine(n=>n%30===0)}).parse(Object.fromEntries(form));
  await db.service.update({where:{id:data.id},data:{price:data.price,duration:data.duration,active:form.get("active")==="on"}});
  revalidatePath("/admin/configuracion"); revalidatePath("/peluqueria"); revalidatePath("/veterinaria");
}
export async function updateAppointment(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const status = z.enum(["PENDING","CONFIRMED","ARRIVED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]).parse(form.get("status"));
  await db.$transaction(async tx => {
    const appointment = await tx.appointment.findUniqueOrThrow({ where: { id } });
    if (["CANCELLED","NO_SHOW","COMPLETED"].includes(appointment.status)) throw new Error("Una cita finalizada no puede reabrirse. Crea una nueva.");
    await tx.appointment.update({ where: { id }, data: { status } });
    if (["CANCELLED","NO_SHOW"].includes(status)) await tx.slot.deleteMany({ where: { appointmentId: id } });
  });
  revalidatePath("/admin"); revalidatePath("/admin/clientes");
}
export async function updateOrder(form: FormData) {
  await requireAdmin();
  const id = z.string().parse(form.get("id"));
  const status = z.enum(["PENDING","PREPARING","READY","FULFILLED","CANCELLED"]).parse(form.get("status"));
  const paymentStatus = z.enum(["UNPAID","PAID"]).parse(form.get("paymentStatus"));
  await db.$transaction(async tx => {
    const order = await tx.order.findUniqueOrThrow({ where: { id }, include: { items: true } });
    if (["CANCELLED","FULFILLED"].includes(order.status)) throw new Error("Este pedido ya está finalizado.");
    await tx.order.update({ where: { id }, data: { status, paymentStatus } });
    if (status === "CANCELLED") for (const item of order.items) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
  });
  revalidatePath("/admin/pedidos"); revalidatePath("/admin"); revalidatePath("/tienda");
}
export async function updateProduct(form: FormData) {
  await requireAdmin();
  const data = z.object({
    id: z.string(), name: z.string().trim().min(2).max(100), description: z.string().trim().min(2).max(1000),
    price: z.coerce.number().int().min(100).max(10000000), stock: z.coerce.number().int().min(0).max(100000),
  }).parse(Object.fromEntries(form));
  await db.product.update({ where: { id: data.id }, data: { name: data.name, description: data.description, price: data.price, stock: data.stock, active: form.get("active") === "on" } });
  revalidatePath("/admin/productos"); revalidatePath("/tienda"); revalidatePath("/"); revalidatePath("/tienda/" + data.id);
}
