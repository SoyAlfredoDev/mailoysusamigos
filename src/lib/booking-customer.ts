import "server-only";
import { headers } from "next/headers";
import { currentCustomer } from "./customer-auth";
import { db } from "./db";
export async function bookingCustomer(requestHeaders?: Headers) {
  const incoming = requestHeaders || await headers();
  // Public booking remains available before customer authentication is configured.
  if (!process.env.BETTER_AUTH_SECRET || !incoming.get("cookie")?.includes("milo_customer")) return null;
  const sessionUser = await currentCustomer(incoming);
  if (!sessionUser) return null;
  const user = await db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, include: { customer: { include: { guardianships: { include: { pet: true } } } } } });
  return { id: user.id, name: [user.name, user.lastName].filter(Boolean).join(" "), email: user.email, phone: user.phone,
    pets: user.customer?.guardianships.map(({ pet }) => ({ id: pet.id, code: pet.code, name: pet.name, species: pet.species, size: pet.size, coat: pet.coat })) || [],
  };
}
