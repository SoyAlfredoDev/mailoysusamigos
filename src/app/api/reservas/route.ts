import { after, NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createBooking, UserError } from "@/lib/operations";
import { hasSameOrigin } from "@/lib/request-origin";
import { bookingCustomer } from "@/lib/booking-customer";
import { bookingSchema } from "@/lib/validation";
import { consumeCustomerLimit, CustomerError } from "@/lib/customer-core";
import { deliverBookingNotices } from "@/lib/booking-notifications";
import { sendBookingEmail } from "@/lib/customer-email";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
export const maxDuration = 120;
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const text = await request.text();
    if (text.length > 8192) return new NextResponse(null, { status: 413 });
    const raw = JSON.parse(text);
    const user = await bookingCustomer(request.headers);
    const input = bookingSchema.parse(user && raw && typeof raw === "object" ? { ...raw, customer: { name: user.name, email: user.email, phone: user.phone } } : raw);
    const ip = process.env.VERCEL === "1" ? (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim() : "local";
    if (!await consumeCustomerLimit(db, "booking-origin", ip, 20, 60) || !await consumeCustomerLimit(db, "booking-email", input.customer.email, 6, 60)) return NextResponse.json({ error: "Espera un momento antes de volver a intentar. Si necesitas ayuda, contáctanos." }, { status: 429 });
    const booking = await createBooking(input, { userId: user?.id });
    after(async () => {
      try { await deliverBookingNotices(db, sendBookingEmail, booking.id); }
      catch { console.error("No se pudo procesar la cola de avisos de citas. Revisa el panel."); }
    });
    revalidatePath("/admin"); revalidatePath("/admin/clientes");
    return NextResponse.json({ reference: booking.reference, status: booking.status, date: booking.date, time: booking.time, price: booking.price, notifications: "QUEUED" }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: "Revisa los datos de la reserva." }, { status: 400 });
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    if (error instanceof CustomerError) return NextResponse.json({ error: "No tienes permiso para usar esa mascota. Revisa tu sesión." }, { status: 403 });
    if (error instanceof UserError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Booking failed");
    return NextResponse.json({ error: "No pudimos completar la solicitud. Vuelve a intentar con los mismos datos; evitaremos duplicar tu cita." }, { status: 500 });
  }
}
