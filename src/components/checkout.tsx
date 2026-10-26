"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, MapPin, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "./cart-provider";
import { money } from "@/lib/format";
export function Checkout() {
  const { items, ready, total, update, clear } = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ reference: string; total: number } | null>(null);
  const key = useRef<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setPending(true); setError("");
    const data = new FormData(e.currentTarget);
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/pedidos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idempotencyKey: key.current, items: items.map(p => ({ productId: p.id, quantity: p.quantity })), accepted: data.get("accepted") === "on", customer: { name: data.get("name"), email: data.get("email"), phone: data.get("phone") } }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No pudimos registrar el pedido.");
      setResult(payload); clear();
    } catch (e) { setError(e instanceof Error ? e.message : "No pudimos registrar el pedido."); }
    finally { setPending(false); }
  }
  if (!ready) return <div className="loading-message"><LoaderCircle className="spin"/> Cargando tu carrito…</div>;
  if (result) return <div className="success-card"><div className="success-icon"><CheckCircle2 size={40}/></div><h1>¡Pedido registrado!</h1><p>Tu solicitud quedó guardada para coordinar el retiro. Todavía no se ha realizado ningún cobro.</p><div className="success-summary"><span>Código de pedido<strong>{result.reference}</strong></span><span>Total registrado<strong>{money(result.total)}</strong></span><span>Estado<strong className="badge pending">Pendiente · sin pagar</strong></span></div><p className="demo-note">Pedido de demostración. No se enviaron mensajes ni se preparará un retiro real.</p><Link className="button dark full" href="/tienda">Seguir explorando <ArrowRight size={18}/></Link></div>;
  if (!items.length) return <div className="empty-state"><ShoppingBag size={45}/><h1>Aquí empieza<br/>su próxima alegría.</h1><p>Tu carrito está vacío. Busquemos algo para tu mejor amigo.</p><Link href="/tienda" className="button dark">Explorar el petshop <ArrowRight size={18}/></Link></div>;
  return <><Link href="/tienda" className="back-link"><ArrowLeft size={17}/> Seguir comprando</Link><div className="eyebrow">UN POQUITO DE FELICIDAD PARA ELLOS</div><h1>Tu carrito<span>.</span></h1><div className="checkout-grid"><div className="cart-list"><AnimatePresence initial={false} mode="popLayout">{items.map(p => <motion.article layout="position" initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.97}} transition={{duration:.22}} className="cart-line" key={p.id}><Image src={p.image} alt={p.name} width={140} height={140}/><div className="cart-line-content"><Link href={"/tienda/" + p.id}><h2>{p.name}</h2></Link><p>{p.detail}</p><strong>{money(p.price)}</strong><div className="quantity-row"><div className="quantity-control"><button aria-label={"Quitar una unidad de " + p.name} onClick={() => update(p.id, p.quantity - 1)} disabled={pending}><Minus size={15}/></button><span>{p.quantity}</span><button aria-label={"Sumar una unidad de " + p.name} onClick={() => update(p.id, p.quantity + 1)} disabled={pending || p.quantity >= Math.min(p.stock,20)}><Plus size={15}/></button></div><button className="remove-item" aria-label={"Eliminar " + p.name} onClick={() => update(p.id,0)} disabled={pending}><Trash2 size={16}/></button><strong>{money(p.price * p.quantity)}</strong></div></div></motion.article>)}</AnimatePresence><div className="demo-note">Los precios y el stock se comprobarán al registrar el pedido. Catálogo de demostración.</div></div><form className="checkout-form" onSubmit={submit}><h2>Coordinemos tu pedido.</h2><p className="muted">Déjanos tus datos para el retiro.</p><label className="field">Nombre completo<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Tu nombre completo" disabled={pending}/></label><label className="field">Correo electrónico<input name="email" required type="email" maxLength={160} autoComplete="email" placeholder="tu@correo.cl" disabled={pending}/></label><label className="field">Celular<input name="phone" required type="tel" autoComplete="tel" maxLength={20} placeholder="+56 9 1234 5678" disabled={pending}/></label><div className="pickup-card"><MapPin size={20}/><div><strong>Retiro en local</strong><span>Coordinación previa con el equipo.</span></div><CheckCircle2 size={18}/></div><div className="order-totals"><span>Subtotal<strong>{money(total)}</strong></span><span>Despacho<strong>No incluido · retiro</strong></span><span className="grand-total">Total<strong>{money(total)}</strong></span></div><label className="checkbox-field"><input required name="accepted" type="checkbox" disabled={pending}/><span>Acepto las <Link href="/condiciones" target="_blank">condiciones y privacidad</Link>.</span></label>{error && <p role="alert" className="form-error">{error}</p>}<button className="button dark full" disabled={pending}>{pending ? <LoaderCircle className="spin" size={18}/> : <ShoppingBag size={18}/>} {pending ? "Registrando…" : "Solicitar pedido"}</button><p className="secure-caption">No se realizará ningún cobro. Pago online pendiente de habilitar.</p></form></div></>;
}
