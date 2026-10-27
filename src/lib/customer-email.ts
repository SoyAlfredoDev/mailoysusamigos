import "server-only";
export type AppMail = { to: string; subject: string; text: string; idempotencyKey?: string };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
export class EmailSendError extends Error {
  constructor(public retryable: boolean, public reason: string) { super("No se pudo enviar el correo."); }
}
export async function sendCustomerEmail(mail: AppMail): Promise<void> { await sendResendEmail(mail); }
export async function sendResendEmail(mail: AppMail): Promise<{ id: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) throw new EmailSendError(false, "CONFIGURATION");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(mail.idempotencyKey ? { "Idempotency-Key": mail.idempotencyKey } : {}) },
    body: JSON.stringify({ from, to: [mail.to], reply_to: "contacto@mailoysusamigos.cl", subject: mail.subject, text: mail.text,
      html: `<div style="background:#f4faf9;padding:32px 16px;font:16px/1.7 Arial,sans-serif;color:#173f4d"><div style="max-width:560px;margin:auto;padding:28px;background:white;border-radius:20px"><h1 style="font-size:24px;color:#087c97">Milo y sus amigos</h1><h2 style="font-size:20px">${escapeHtml(mail.subject)}</h2>${mail.text.split("\n").map(line => /^https?:\/\//.test(line) ? `<p><a style="color:#087c97;word-break:break-all" href="${escapeHtml(line)}">Continuar de forma segura</a></p>` : `<p>${escapeHtml(line)}</p>`).join("")}<p style="font-size:12px;color:#647b83">Si no solicitaste este correo, puedes ignorarlo. Nunca te pediremos tu contraseña por correo.</p></div></div>` }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new EmailSendError(response.status === 429 || response.status >= 500, "HTTP_" + response.status);
  const result = await response.json();
  if (typeof result.id !== "string") throw new EmailSendError(true, "INVALID_RESPONSE");
  return { id: result.id };
}

export async function sendBookingEmail(mail: AppMail): Promise<{ id: string }> {
  for (let attempt = 0; ; attempt++) {
    try { return await sendResendEmail(mail); }
    catch (error) {
      if (attempt >= 2 || (error instanceof EmailSendError && !error.retryable)) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * 2 ** attempt));
    }
  }
}
