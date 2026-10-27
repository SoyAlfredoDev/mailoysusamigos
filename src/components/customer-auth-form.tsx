"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle, Mail, PawPrint } from "lucide-react";
import { customerAuthClient } from "@/lib/customer-auth-client";
import { safeReturnTo } from "@/lib/customer-validation";
import { Brand } from "./site-shell";
type Mode = "login" | "register" | "forgot" | "reset";
const content = {
  login: ["QUÉ BUENO VOLVER A VERTE", "Bienvenido a la familia.", "Ingresa con tu correo y contraseña."],
  register: ["UN LUGAR PARA TI Y TUS AMIGOS", "Seamos parte de su historia.", "Solo necesitamos tus datos básicos para crear tu cuenta."],
  forgot: ["VOLVAMOS A ENCONTRARNOS", "Recupera tu acceso.", "Te enviaremos un enlace para elegir una nueva contraseña."],
  reset: ["TU CUENTA, EN BUENAS MANOS", "Elige tu contraseña.", "Usa al menos 12 caracteres. Una frase que recuerdes funciona muy bien."],
};
export function CustomerAuthForm({ mode, token = "", returnTo = "/mi-cuenta" }: { mode: Mode; token?: string; returnTo?: string }) {
  const [pending, setPending] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [show, setShow] = useState(false), [email, setEmail] = useState("");
  const continuation = safeReturnTo(returnTo);
  const suffix = continuation === "/mi-cuenta" ? "" : "?continuar=" + encodeURIComponent(continuation);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      if (mode === "login") {
        const result = await customerAuthClient.signIn.email({ email: email.trim().toLowerCase(), password: String(data.get("password")), rememberMe: false });
        if (result.error) throw new Error("Revisa tus datos y confirma tu correo antes de ingresar.");
        location.assign(continuation); return;
      }
      if (mode === "register") {
        const response = await fetch("/api/auth/sign-up/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: String(data.get("name")).trim(), lastName: String(data.get("lastName")).trim(), phone: String(data.get("phone")).trim(), email: email.trim().toLowerCase(), password: String(data.get("password")), accepted: data.get("accepted") === "on", callbackURL: "/ingresar" + suffix }) });
        if (!response.ok) throw new Error("No pudimos completar el registro. Revisa los datos e intenta más tarde.");
        setMessage("Si el registro pudo completarse, recibirás un enlace para confirmar tu correo. Si ya tienes cuenta, ingresa o recupera tu contraseña.");
      }
      if (mode === "forgot") {
        const result = await customerAuthClient.requestPasswordReset({ email: email.trim().toLowerCase(), redirectTo: location.origin + "/restablecer" });
        if (result.error) throw new Error("No pudimos procesar la solicitud. Espera unos minutos e intenta nuevamente.");
        setMessage("Si el correo tiene una cuenta, recibirás un enlace de recuperación. Revisa también la carpeta de spam.");
      }
      if (mode === "reset") {
        if (!token) throw new Error("El enlace no es válido. Solicita uno nuevo.");
        const result = await customerAuthClient.resetPassword({ token, newPassword: String(data.get("password")) });
        if (result.error) throw new Error("El enlace no es válido o ha vencido. Solicita uno nuevo.");
        setMessage("Tu contraseña quedó guardada. Ya puedes ingresar con tu correo.");
      }
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos completar la solicitud."); }
    finally { setPending(false); }
  }
  async function resend() {
    if (!email) { setError("Escribe tu correo para solicitar un nuevo enlace."); return; }
    setPending(true); setError("");
    try {
      const result = await customerAuthClient.sendVerificationEmail({ email: email.trim().toLowerCase(), callbackURL: "/ingresar" });
      if (result.error) throw new Error();
      setMessage("Si corresponde, recibirás un nuevo enlace de verificación. Espera unos minutos antes de solicitar otro.");
    } catch { setError("No pudimos procesar la solicitud. Intenta más tarde."); }
    finally { setPending(false); }
  }
  return <div className="customer-auth-page"><Brand/><section className="customer-auth-card"><div className="account-symbol"><PawPrint size={26}/></div><div className="eyebrow">{content[mode][0]}</div><h1>{content[mode][1]}</h1><p className="account-intro">{content[mode][2]}</p>
    {message ? <div className="account-feedback" role="status"><Mail size={25}/><p>{message}</p><Link href={"/ingresar" + suffix} className="button dark full">Ir al acceso <ArrowRight size={17}/></Link>{mode === "login" && <button className="text-link" onClick={() => setMessage("")}>Volver a intentar</button>}</div> : <form onSubmit={submit}>
      <fieldset disabled={pending} className="account-fields">
        {mode === "register" && <div className="account-name-grid"><label className="field">Nombre<input name="name" autoComplete="given-name" required minLength={2} maxLength={60}/></label><label className="field">Apellido<input name="lastName" autoComplete="family-name" required minLength={2} maxLength={60}/></label></div>}
        {mode !== "reset" && <label className="field">Correo electrónico<input type="email" name="email" autoComplete="email" required maxLength={160} value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl"/></label>}
        {mode === "register" && <label className="field">Celular<input type="tel" name="phone" autoComplete="tel" required maxLength={20} placeholder="+56 9 1234 5678"/></label>}
        {mode !== "forgot" && <label className="field">{mode === "reset" ? "Nueva contraseña" : "Contraseña"}<span className="password-field"><input name="password" type={show ? "text" : "password"} required minLength={mode === "login" ? 1 : 12} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={show} onClick={() => setShow(!show)}>{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></span>{mode === "register" && <small>Al menos 12 caracteres.</small>}</label>}
        {mode === "register" && <label className="checkbox-field"><input name="accepted" type="checkbox" required/><span>Acepto las <Link href="/condiciones" target="_blank">condiciones y privacidad</Link>.</span></label>}
      </fieldset>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button dark full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <ArrowRight size={18}/>} {pending ? "Un momento…" : ({ login: "Ingresar", register: "Crear mi cuenta", forgot: "Enviar enlace", reset: "Guardar contraseña" }[mode])}</button>
    </form>}
    <div className="account-links">{mode === "login" ? <><Link href="/recuperar">Olvidé mi contraseña</Link><Link href={"/registro" + suffix}>Crear una cuenta</Link>{!message && <button onClick={resend} disabled={pending}>Reenviar verificación</button>}</> : <Link href={"/ingresar" + suffix}>Volver al acceso</Link>}</div>
  </section><Link href="/" className="account-home">Volver a Milo y sus amigos</Link></div>;
}
