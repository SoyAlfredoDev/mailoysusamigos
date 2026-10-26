import { Booking } from "@/components/booking";
import { db } from "@/lib/db";
import { today } from "@/lib/schedule";
export const metadata = { title: "Atención veterinaria" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const services = await db.service.findMany({ where: { kind: "VET", active: true }, orderBy: { price: "desc" } });
  return <Booking kind="VET" services={services} initialDate={today()}/>;
}
