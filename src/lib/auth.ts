import "server-only";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { redirect } from "next/navigation";
export function adminConfigured() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}
export async function adminSession() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("Configura SESSION_SECRET con al menos 32 caracteres.");
  return getIronSession<{ admin?: boolean; email?: string }>(await cookies(), {
    password: process.env.SESSION_SECRET, cookieName: "milo_admin",
    ttl: 60 * 60 * 8, cookieOptions: { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" },
  });
}
export async function requireAdmin() {
  if (!adminConfigured()) redirect("/acceso");
  const session = await adminSession();
  if (!session.admin || session.email !== process.env.ADMIN_EMAIL) redirect("/acceso");
  return session;
}
