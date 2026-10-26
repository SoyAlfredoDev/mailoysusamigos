"use client";
import { useState, useTransition } from "react";
import { Check, LoaderCircle } from "lucide-react";
export function AdminForm({ action, children, className = "", label = "Guardar cambios" }: { action: (form: FormData) => Promise<void>; children: React.ReactNode; className?: string; label?: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  return <form className={className} action={data => { setMessage(""); startTransition(async () => { try { await action(data); setFailed(false); setMessage("Cambios guardados."); } catch { setFailed(true); setMessage("No se pudo guardar. Revisa los datos o la disponibilidad e intenta de nuevo."); } }); }}><fieldset disabled={pending}>{children}</fieldset><button className="button dark small" disabled={pending}>{pending ? <LoaderCircle size={14} className="spin"/> : <Check size={14}/>} {pending ? "Guardando…" : label}</button>{message && <p role="status" className={failed ? "form-error" : "save-message"}>{message}</p>}</form>;
}
