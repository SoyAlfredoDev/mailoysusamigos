import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { availableTimes } from "@/lib/operations";
import { addDays, today, isValidDate, isWalkInDate } from "@/lib/schedule";
export async function GET(request: NextRequest) {
  const serviceId = request.nextUrl.searchParams.get("servicio") || "";
  const date = request.nextUrl.searchParams.get("fecha") || "";
  if (!isValidDate(date) || date < today() || date > addDays(today(), 30)) return NextResponse.json({ times: [] });
  const service = await db.service.findFirst({ where: { id: serviceId, active: true } });
  const walkIn = service ? isWalkInDate(date, service.kind) : false;
  const times = await availableTimes(serviceId, date, request.nextUrl.searchParams.get("tamano") || undefined);
  return NextResponse.json({ times, walkIn }, { headers: { "Cache-Control": "no-store" } });
}
