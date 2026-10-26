"use server";
import { scryptSync, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/auth";
import { db } from "@/lib/db";
export async function login(_: { error: string }, form: FormData) {
  const email = String(form.get("email") || "").trim().toLowerCase().slice(0,160);
  const password = String(form.get("password") || "").slice(0,200);
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return { error: "El acceso del equipo todavía no está configurado." };
  const now = new Date();
  const key = "admin-login";
  const attempt = await db.loginAttempt.upsert({
    where: { key }, create: { key, count: 0, resetAt: new Date(now.getTime() + 15 * 60000) }, update: {},
  });
  if (attempt.resetAt <= now) await db.loginAttempt.update({ where: { key }, data: { count: 0, resetAt: new Date(now.getTime() + 15 * 60000) } });
  else if (attempt.count >= 10) return { error: "Demasiados intentos. Espera 15 minutos e intenta nuevamente." };
  const provided = scryptSync(password, "milo-admin-login-v1", 64);
  const expected = scryptSync(process.env.ADMIN_PASSWORD, "milo-admin-login-v1", 64);
  if (email !== process.env.ADMIN_EMAIL.toLowerCase() || !timingSafeEqual(provided,expected)) {
    await db.loginAttempt.update({ where: { key }, data: { count: { increment: 1 } } });
    return { error: "El correo o la contraseña no son correctos." };
  }
  await db.loginAttempt.delete({ where: { key } });
  const session = await adminSession();
  session.admin = true; session.email = process.env.ADMIN_EMAIL;
  await session.save();
  redirect("/admin");
}
export async function logout() {
  const session = await adminSession();
  session.destroy();
  redirect("/acceso");
}
