"use client";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle, LockKeyhole } from "lucide-react";
import { login } from "@/app/acceso/actions";
import { Brand } from "./site-shell";
export function Login() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return <div className="login-page"><Brand/><form action={action} className="login-card"><div className="login-icon"><LockKeyhole size={26}/></div><div className="eyebrow">ESPACIO DEL EQUIPO</div><h1>Todo en orden.<br/><span>Todos bien cuidados.</span></h1><p>Ingresa para gestionar la agenda, el catálogo y los pedidos de nuestros amigos.</p><label className="field">Correo del equipo<input required type="email" name="email" autoComplete="username" placeholder="tu@correo.cl"/></label><label className="field">Contraseña<input required type="password" name="password" autoComplete="current-password" placeholder="Tu contraseña"/></label>{state.error && <p role="alert" className="form-error">{state.error}</p>}<button className="button dark full" disabled={pending}>{pending ? <LoaderCircle size={17} className="spin"/> : <ArrowRight size={17}/>} {pending ? "Ingresando…" : "Entrar al panel"}</button><p className="secure-caption">Acceso exclusivo para el equipo autorizado.</p></form><a className="back-link" href="/">← Volver al sitio</a></div>;
}
