import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createOrder, UserError } from "@/lib/operations";
import { hasSameOrigin } from "@/lib/request-origin";
export async function POST(request: NextRequest) {
  if (!hasSameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403 });
  try {
    const order = await createOrder(await request.json());
    return NextResponse.json({ reference: order.reference, total: order.total }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    if (error instanceof UserError) return NextResponse.json({ error: error.message }, { status: 409 });
    console.error("Order failed", error);
    return NextResponse.json({ error: "No pudimos registrar el pedido. Intenta nuevamente." }, { status: 500 });
  }
}
