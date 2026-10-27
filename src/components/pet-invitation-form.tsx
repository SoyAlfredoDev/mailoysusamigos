"use client";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
export function PetInvitationForm({ code, token }: { code?: string; token?: string }) {
  const [pending, setPending] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  return message ? <div className="account-feedback" role="status"><p>{message}</p><Link className="button dark" href="/mi-cuenta">Volver a la bienvenida</Link></div> : <form onSubmit={async event => {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/mascotas/invitaciones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(token ? { action: "accept", token } : { action: "invite", code, email: form.get("email") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(data.message);
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la solicitud."); }
    finally { setPending(false); }
  }}>{!token && <label className="field">Correo del nuevo tutor<input type="email" name="email" required maxLength={160} autoComplete="off" disabled={pending} placeholder="su@correo.cl"/></label>}{error && <p role="alert" className="form-error">{error}</p>}<button className="button dark full" disabled={pending}>{pending && <LoaderCircle size={18} className="spin"/>}{token ? "Aceptar invitación" : "Enviar invitación"}</button><p className="field-hint">{token ? "Al aceptar, tu cuenta quedará asociada a esta mascota." : "La otra persona debe verificar su correo y aceptar. El enlace vence en 48 horas."}</p></form>;
}
