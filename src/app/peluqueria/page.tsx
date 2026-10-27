import { bookingCustomer } from "@/lib/booking-customer";
import { Booking } from "@/components/booking";
import { db } from "@/lib/db";
import { today } from "@/lib/schedule";
export const metadata = { title: "Peluquería canina" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const services = await db.service.findMany({ where: { kind: "GROOMING", active: true }, orderBy: { duration: "desc" } });
  const customer = await bookingCustomer();
  return <Booking kind="GROOMING" services={services} initialDate={today()} customer={customer}/>;
}
