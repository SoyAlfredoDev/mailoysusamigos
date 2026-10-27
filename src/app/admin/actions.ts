"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { after } from "next/server";
import { rescheduleBooking, setBookingStatus } from "@/lib/operations";
import { deliverBookingNotices } from "@/lib/booking-notifications";
import { sendBookingEmail } from "@/lib/customer-email";
function processBookingMail(id: string) {
  after(async () => { try { await deliverBookingNotices(db, sendBookingEmail, id); } catch { console.error("Revisa los avisos de citas en el panel."); } });
}
export async function rescheduleAppointment(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).max(80).parse(form.get("id"));
  const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(form.get("date"));
  const time = z.string().regex(/^\d{2}:\d{2}$/).parse(form.get("time"));
  await rescheduleBooking(id, date, time);
  processBookingMail(id);
  revalidatePath("/admin");
}
export async function retryAppointmentNotices(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).max(80).parse(form.get("id"));
  const changed = await db.appointmentNotice.updateMany({ where: { appointmentId: id, OR: [{status: { in: ["PENDING", "FAILED"] }}, {status:"SENDING",lockedUntil:{lte:new Date()}}], createdAt: { gt: new Date(Date.now() - 23 * 3600000) } }, data: { status: "PENDING", nextAttemptAt: new Date(), attempts: 0, lastError: null } });
  if (!changed.count) throw new Error("No hay avisos pendientes dentro del período de reintento seguro.");
  processBookingMail(id);
  revalidatePath("/admin");
}
export async function updateService(form: FormData) {
  await requireAdmin();
  const data=z.object({id:z.string(),price:z.coerce.number().int().min(100).max(1000000),duration:z.coerce.number().int().min(30).max(180).refine(n=>n%30===0)}).parse(Object.fromEntries(form));
  await db.service.update({where:{id:data.id},data:{price:data.price,duration:(await db.service.findUniqueOrThrow({where:{id:data.id}})).kind === "VET" ? 30 : data.duration,active:form.get("active")==="on"}});
  revalidatePath("/admin/configuracion"); revalidatePath("/peluqueria"); revalidatePath("/veterinaria");
}
export async function updateAppointment(form: FormData) {
  await requireAdmin();
  const id = z.string().min(1).max(80).parse(form.get("id"));
  const status = z.enum(["PENDING","CONFIRMED","ARRIVED","IN_PROGRESS","COMPLETED","CANCELLED","NO_SHOW"]).parse(form.get("status"));
  await setBookingStatus(id, status);
  processBookingMail(id);
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
