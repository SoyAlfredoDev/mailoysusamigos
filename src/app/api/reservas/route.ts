import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createBooking, UserError } from "@/lib/operations";
import { hasSameOrigin } from "@/lib/request-origin";
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const booking = await createBooking(await request.json());
    return NextResponse.json({ reference: booking.reference, status: booking.status, date: booking.date, time: booking.time, price: booking.price }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    if (error instanceof UserError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Booking failed", error);
    return NextResponse.json({ error: "No pudimos guardar la reserva. Intenta nuevamente." }, { status: 500 });
  }
}
