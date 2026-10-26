import { NextRequest, NextResponse } from "next/server";
import { availableTimes } from "@/lib/operations";
import { addDays, today } from "@/lib/schedule";
export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("servicio") || "";
  const date = request.nextUrl.searchParams.get("fecha") || "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || date < today() || date > addDays(today(), 30)) return NextResponse.json({ times: [] });
  const times = await availableTimes(serviceId, date, request.nextUrl.searchParams.get("tamano") || undefined);
  return NextResponse.json({ times }, { headers: { "Cache-Control": "no-store" } });
}
