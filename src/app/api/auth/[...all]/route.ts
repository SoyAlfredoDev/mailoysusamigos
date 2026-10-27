import { getCustomerAuth } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import { consumeCustomerLimit } from "@/lib/customer-core";
import { hasSameOrigin } from "@/lib/request-origin";
export const runtime = "nodejs";
const getPaths = new Set(["/ok", "/get-session", "/verify-email", "/error"]);
const postPaths = new Set(["/sign-up/email", "/sign-in/email", "/sign-out", "/request-password-reset", "/reset-password", "/send-verification-email"]);
export async function GET(request: Request) {
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (!getPaths.has(path) && !/^\/reset-password\/[A-Za-z0-9_-]+$/.test(path)) return new Response(null, { status: 404 });
  return getCustomerAuth().handler(request);
}
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
  const path = new URL(request.url).pathname.replace(/^\/api\/auth/, "");
  if (!postPaths.has(path)) return new Response(null, { status: 404 });
  const text = await request.text();
  if (text.length > 8192) return new Response(null, { status: 413 });
  let body;
  try { body = JSON.parse(text); } catch { return Response.json({ error: "Revisa los datos." }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Revisa los datos." }, { status: 400 });
  if (path === "/sign-up/email" && body.accepted !== true) return Response.json({ error: "Acepta las condiciones para continuar." }, { status: 400 });
  if (typeof body.email === "string" && path !== "/sign-out") {
    const email = body.email.trim().toLowerCase().slice(0, 160);
    const max = path === "/sign-in/email" ? 12 : 5;
    if (!await consumeCustomerLimit(db, path, email, max)) return Response.json({ error: "Espera unos minutos antes de volver a intentar." }, { status: 429 });
    body.email = email;
  }
  return getCustomerAuth().handler(new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify(body) }));
}
