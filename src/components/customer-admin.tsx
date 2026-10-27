"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus } from "lucide-react";
export function CustomerAdminCreate({ contacts }: { contacts: { id: string; name: string; lastName: string; email: string }[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault(); setPending(true); setMessage(""); setError("");
    const form = event.currentTarget, fields = new FormData(form);
    try {
      const body = action === "create-pet" ? { action, name: fields.get("name"), species: fields.get("species"), customerIds: [fields.get("customerId")] } : { ...Object.fromEntries(fields), action };
      const response = await fetch("/api/admin/personas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error);
      setMessage(data.message); form.reset(); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la operación."); }
    finally { setPending(false); }
  }
  return <section className="account-admin-create"><details className="admin-card"><summary><Plus size={18}/> Crear cuenta de cliente</summary><form onSubmit={e => submit(e, "create-user")}><fieldset disabled={pending}><div className="form-grid"><label className="field">Nombre<input name="name" required minLength={2} maxLength={60}/></label><label className="field">Apellido<input name="lastName" required minLength={2} maxLength={60}/></label><label className="field">Correo<input name="email" type="email" required maxLength={160}/></label><label className="field">Celular<input name="phone" type="tel" required maxLength={20} placeholder="+56 9 1234 5678"/></label></div></fieldset><p className="field-hint">La persona recibirá un enlace para confirmar su correo y elegir su contraseña. El equipo no accede a ella.</p><button className="button dark" disabled={pending}>{pending && <LoaderCircle size={16} className="spin"/>}Crear cuenta</button></form></details>
    <details className="admin-card"><summary><Plus size={18}/> Crear mascota</summary><form onSubmit={e => submit(e, "create-pet")}><fieldset disabled={pending}><label className="field">Nombre de la mascota<input name="name" required minLength={2} maxLength={60}/></label><label className="field">Especie<select name="species"><option value="DOG">Perro</option><option value="CAT">Gato</option></select></label><label className="field">Tutor inicial<select name="customerId" required defaultValue=""><option value="" disabled>Selecciona una persona</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.lastName} · {c.email}</option>)}</select></label></fieldset><p className="field-hint">El código corto se asigna automáticamente. Los demás tutores se incorporan por invitación y aceptación.</p><button className="button dark" disabled={pending || !contacts.length}>Crear mascota</button></form></details>
    {message && <p className="save-message" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
  </section>;
}
export function CustomerAdminAccount({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false), [message, setMessage] = useState("");
  async function update(action: string) {
    setPending(true); setMessage("");
    try {
      const response = await fetch("/api/admin/personas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, active: !active }) });
      const data = await response.json(); setMessage(data.message || data.error); if (response.ok) router.refresh();
    } catch { setMessage("No se pudo completar la solicitud."); }
    finally { setPending(false); }
  }
  return <div className="account-admin-actions"><button className="text-link" disabled={pending || !active} onClick={() => update("activate")}>Enviar acceso</button><button className="text-link" disabled={pending} onClick={() => update("set-active")}>{active ? "Deshabilitar acceso" : "Habilitar acceso"}</button>{message && <p role="status">{message}</p>}</div>;
}
