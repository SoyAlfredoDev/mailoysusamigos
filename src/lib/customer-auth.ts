import "server-only";
import { after } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createCustomerAuth } from "./customer-auth-core";
import { sendCustomerEmail } from "./customer-email";
import { safeReturnTo } from "./customer-validation";
export const customerBaseURL = () => process.env.BETTER_AUTH_URL || (process.env.VERCEL === "1" ? "https://mailoysusamigos.cl" : "http://127.0.0.1:3007");
let singleton: ReturnType<typeof createCustomerAuth> | undefined;
export function getCustomerAuth() {
  if (singleton) return singleton;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Configura BETTER_AUTH_SECRET antes de habilitar cuentas de clientes.");
  singleton = createCustomerAuth(db, { secret, baseURL: customerBaseURL(), mail: sendCustomerEmail,
    backgroundTask: task => { const settled = task.catch(() => console.error("No se pudo entregar un correo de cuenta. Revisa Resend.")); after(() => settled); },
  });
  return singleton;
}
export async function requireCustomer(returnTo = "/mi-cuenta") {
  const user = await currentCustomer(await headers());
  if (!user) redirect("/ingresar?continuar=" + encodeURIComponent(safeReturnTo(returnTo)));
  return user;
}
export async function currentCustomer(requestHeaders: Headers) {
  const session = await getCustomerAuth().api.getSession({ headers: requestHeaders });
  return session ? db.user.findFirst({ where: { id: session.user.id, active: true, emailVerified: true }, select: { id: true, name: true, email: true } }) : null;
}
