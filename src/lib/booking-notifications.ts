import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { AppMail } from "./customer-email";
import { dateLabel, TIMEZONE } from "./schedule";
import { statusLabel } from "./format";
type Store = PrismaClient | Prisma.TransactionClient;
export async function queueBookingNotices(db: Store, appointmentId: string, event: "CREATED" | "UPDATED" | "RESCHEDULED") {
  const a = await db.appointment.findUniqueOrThrow({ where: { id: appointmentId }, include: { customer: true, pet: true, service: true } });
  // Superseded unsent notices must not later announce an outdated time or status.
  await db.appointmentNotice.updateMany({ where: { appointmentId, status: { in: ["PENDING", "FAILED"] } }, data: { status: "CANCELLED" } });
  const state = statusLabel[a.status] || a.status;
  const title = event === "CREATED" ? "Cita confirmada" : event === "RESCHEDULED" ? "Cita reprogramada" : "Actualización de tu cita";
  const summary = `${a.service.name}\nMascota: ${a.pet.name} (${a.pet.code})\nFecha: ${dateLabel(a.date)}\nHora: ${a.time} · Santiago de Chile (${TIMEZONE})\nCódigo de reserva: ${a.reference}\nEstado: ${state}`;
  const contactName = a.contactName || a.customer.name;
  const contactEmail = a.contactEmail || a.customer.email;
  const contactPhone = a.contactPhone || a.customer.phone;
  const teamEmail = process.env.BOOKING_TEAM_EMAIL || "contacto@mailoysusamigos.cl";
  await db.appointmentNotice.createMany({ data: [
    { appointmentId, audience: "CUSTOMER", to: contactEmail, subject: `${title} · ${a.reference}`, text: `Hola ${contactName}.\n${summary}\nPara consultar o solicitar cambios, responde a este correo o comunícate con el equipo al +56 9 3722 9564.\nNo se ha realizado un cobro en línea.` },
    { appointmentId, audience: "TEAM", to: teamEmail, subject: `${title} · ${a.service.kind === "VET" ? "Veterinaria" : "Peluquería"} · ${a.reference}`, text: `${summary}\nTutor: ${contactName}\nCorreo: ${contactEmail}\nCelular: ${contactPhone}\nRevisa el detalle en el panel administrativo.` },
  ] });
}
export type NoticeTransport = (mail: AppMail) => Promise<{ id: string }>;
export async function deliverBookingNotices(db: PrismaClient, transport: NoticeTransport, appointmentId?: string) {
  const now = new Date();
  const rows = await db.appointmentNotice.findMany({ where: {
    ...(appointmentId ? { appointmentId } : {}),
    OR: [{ status: "PENDING", nextAttemptAt: { lte: now } }, { status: "SENDING", lockedUntil: { lte: now } }],
  }, orderBy: { createdAt: "asc" }, take: 4 });
  for (const row of rows) {
    // Stop ambiguous retries before Resend's 24-hour idempotency window expires.
    if (now.getTime() - row.createdAt.getTime() > 23 * 3600000) {
      await db.appointmentNotice.updateMany({ where: { id: row.id, status: { in: ["PENDING", "SENDING"] } }, data: { status: "FAILED", lastError: "REVIEW_REQUIRED" } });
      continue;
    }
    const lockedUntil = new Date(Date.now() + 60000);
    const claim = await db.appointmentNotice.updateMany({ where: { id: row.id, OR: [{ status: "PENDING", nextAttemptAt: { lte: now } }, { status: "SENDING", lockedUntil: { lte: now } }] }, data: { status: "SENDING", lockedUntil, attempts: { increment: 1 } } });
    if (!claim.count) continue;
    try {
      const sent = await transport({ to: row.to, subject: row.subject, text: row.text, idempotencyKey: "booking/" + row.id });
      await db.appointmentNotice.updateMany({ where: { id: row.id, status: "SENDING", lockedUntil }, data: { status: "SENT", providerId: sent.id, sentAt: new Date(), lockedUntil: null, lastError: null } });
    } catch (error) {
      const failure = error as { retryable?: boolean; reason?: string };
      const retryable = failure.retryable !== false && row.attempts + 1 < 5;
      await db.appointmentNotice.updateMany({ where: { id: row.id, status: "SENDING", lockedUntil }, data: { status: retryable ? "PENDING" : "FAILED", lockedUntil: null, nextAttemptAt: new Date(Date.now() + Math.min(30 * 60000, 60000 * 2 ** row.attempts)), lastError: failure.reason && /^(HTTP_\d{3}|CONFIGURATION|INVALID_RESPONSE)$/.test(failure.reason) ? failure.reason : "TRANSPORT_ERROR" } });
    }
  }
}
