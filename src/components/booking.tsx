"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Info, LoaderCircle, PawPrint, Scissors, Stethoscope } from "lucide-react";
import { addDays, dateLabel, serviceQuote } from "@/lib/schedule";
import { money } from "@/lib/format";
export type ServiceView = { id: string; name: string; kind: string; description: string; price: number; duration: number };
export function Booking({ kind, services, initialDate }: { kind: "GROOMING" | "VET"; services: ServiceView[]; initialDate: string }) {
  const grooming = kind === "GROOMING";
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState(services[0]?.id || "");
  const [size, setSize] = useState("SMALL");
  const [coat, setCoat] = useState("LONG");
  const [species, setSpecies] = useState("DOG");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [times, setTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [timesError, setTimesError] = useState(false);
  const [result, setResult] = useState<{ reference: string; price: number } | null>(null);
  const [fields, setFields] = useState({ petName: "", name: "", email: "", phone: "", notes: "" });
  const [accepted, setAccepted] = useState(false);
  const service = services.find(s => s.id === serviceId);
  const quote = service ? serviceQuote(service, size) : { price: 0, duration: 0 };
  useEffect(() => {
    const controller = new AbortController();
    setLoadingTimes(true); setTime(""); setTimes([]); setTimesError(false);
    fetch("/api/disponibilidad?servicio=" + serviceId + "&fecha=" + date + "&tamano=" + size, { signal: controller.signal })
      .then(async r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setTimes(data.times))
      .catch(e => { if (e.name !== "AbortError") setTimesError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoadingTimes(false); });
    return () => controller.abort();
  }, [date, serviceId, size]);
  function next() {
    setError("");
    if (step === 2 && !time) { setError("Selecciona un horario para continuar."); return; }
    setStep(step + 1);
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setPending(true); setError("");
    try {
      const response = await fetch("/api/reservas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ serviceId, date, time, size: grooming ? size : undefined, coat: grooming ? coat : undefined, petName: fields.petName, species, notes: fields.notes, accepted, customer: { name: fields.name, email: fields.email, phone: fields.phone } }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pudimos guardar la reserva.");
      setResult(data);
    } catch (e) { setError(e instanceof Error ? e.message : "Ocurrió un error. Intenta de nuevo."); }
    finally { setPending(false); }
  }
  if (!service) return <div className="empty-state"><h1>No hay servicios disponibles</h1><p>Contáctanos para coordinar una atención.</p></div>;
  if (result) return <div className="container page-section"><div className="success-card"><div className="success-icon"><CheckCircle2 size={40}/></div><div className="eyebrow">YA ESTÁ EN NUESTRA AGENDA</div><h1>¡Gracias por confiar<br/>en nosotros!</h1><p>Tu solicitud quedó guardada. El equipo debe confirmarla antes de la visita.</p><div className="success-summary"><span>Código de reserva<strong>{result.reference}</strong></span><span>Servicio<strong>{service.name}</strong></span><span>Fecha y hora<strong>{dateLabel(date)} · {time}</strong></span><span>Valor de ejemplo<strong>{money(result.price)}</strong></span><span>Estado<strong className="badge pending">Pendiente de confirmación</strong></span></div><p className="demo-note">Reserva de demostración. No se ha enviado un correo ni realizado un cobro.</p><Link href="/" className="button dark full">Volver al inicio <ArrowRight size={18}/></Link></div></div>;
  return <div className="container booking-page"><div className="booking-intro"><Link href="/agendar" className="back-link"><ArrowLeft size={16}/> Nuestros servicios</Link><div className="eyebrow">{grooming ? "UN CARIÑO PARA SU PELAJE" : "SU SALUD EN BUENAS MANOS"}</div><h1>{grooming ? <>Un look nuevo.<br/><span>La misma felicidad.</span></> : <>Cuidemos juntos<br/><span>a tu mejor amigo.</span></>}</h1><p>{grooming ? "Un momento de cuidado, de la nariz a la colita. Agenda su próxima visita a la peluquería." : "Encuentra una hora para su próxima atención veterinaria. Para perros y gatos, en cada etapa."}</p><div className="booking-photo"><Image src={grooming ? "/images/real/milo.webp" : "/images/real/consultorio.webp"} alt={grooming ? "Milo en la peluquería canina del local" : "Consultorio veterinario de Milo y sus amigos"} width={800} height={600} sizes="(min-width: 900px) 480px, 100vw"/><span><HeartIcon/> Cuidamos lo que más quieres.</span></div><div className="booking-help"><Info size={17}/><p>Servicios, precios y horarios de demostración. <a href="https://wa.me/56937229564" target="_blank" rel="noreferrer">Consulta al equipo</a> para una atención real.</p></div></div>
    <section className="booking-panel" aria-label={"Agendar " + (grooming ? "peluquería" : "veterinaria")}><div className="booking-panel-heading">{grooming ? <Scissors size={23}/> : <Stethoscope size={23}/>}<h2>Agenda {grooming ? "peluquería" : "veterinaria"}</h2></div><ol className="booking-progress">{["Servicio", "Horario", "Datos"].map((label,i) => <li key={label} className={step >= i + 1 ? "current" : ""} aria-current={step === i + 1 ? "step" : undefined}><span>{step > i + 1 ? <Check size={15}/> : i + 1}</span>{label}</li>)}</ol>
    <AnimatePresence mode="wait" initial={false}><motion.div className="booking-step-stage" key={step} initial={reduced ? false : {opacity:0,x:14}} animate={{opacity:1,x:0}} exit={{opacity:reduced ? 1 : 0,x:reduced ? 0 : -10}} transition={{duration:reduced ? 0 : .16}}>
    {step === 1 && <div className="booking-step"><h3>¿Qué necesita tu mascota?</h3><div className="service-options">{services.map(s => <button key={s.id} className={serviceId === s.id ? "service-option selected" : "service-option"} onClick={() => setServiceId(s.id)} aria-pressed={serviceId === s.id}><span className="radio-dot"/><span><strong>{s.name}</strong><small>{s.description}</small><em><Clock3 size={13}/>{s.duration} min · {grooming ? "Desde " : ""}{money(s.price)}</em></span></button>)}</div>{grooming && <><fieldset><legend>Tamaño de tu mascota</legend><div className="choice-row">{[{ id: "SMALL", label: "Pequeño" }, { id: "MEDIUM", label: "Mediano" }, { id: "LARGE", label: "Grande" }, { id: "GIANT", label: "Gigante" }].map(s => <button key={s.id} className={size === s.id ? "selected" : ""} onClick={() => setSize(s.id)} aria-pressed={size === s.id}>{s.label}</button>)}</div></fieldset><fieldset><legend>Tipo de pelo</legend><div className="choice-row">{[{ id: "SHORT", label: "Corto" }, { id: "MEDIUM", label: "Medio" }, { id: "LONG", label: "Largo" }, { id: "CURLY", label: "Rizado" }].map(c => <button key={c.id} className={coat === c.id ? "selected" : ""} onClick={() => setCoat(c.id)} aria-pressed={coat === c.id}>{c.label}</button>)}</div></fieldset><p className="field-hint"><Info size={14}/> El valor y la duración varían según el tamaño.</p></>}</div>}
    {step === 2 && <div className="booking-step"><h3>Busquemos su próxima visita.</h3><label className="field">Elige una fecha<input type="date" value={date} min={initialDate} max={addDays(initialDate,30)} onChange={e => { if (e.target.value) setDate(e.target.value); }}/></label><div className="date-strip">{Array.from({ length: 5 }, (_,i) => addDays(date, i)).filter(d => d <= addDays(initialDate,30)).map(d => <button key={d} className={date === d ? "selected" : ""} onClick={() => setDate(d)} aria-pressed={date === d}><span>{new Intl.DateTimeFormat("es", { weekday: "short", timeZone: "UTC" }).format(new Date(d + "T12:00Z"))}</span><strong>{Number(d.slice(-2))}</strong></button>)}</div><h4>Horarios disponibles <span>· {quote.duration} min</span></h4>{loadingTimes ? <p className="loading-message"><LoaderCircle size={18} className="spin"/> Buscando horarios…</p> : times.length ? <div className="time-grid">{times.map(t => <button key={t} className={time === t ? "selected" : ""} onClick={() => setTime(t)} aria-pressed={time === t}>{t}</button>)}</div> : <div className="inline-empty"><CalendarDays size={24}/><p>{timesError ? "No pudimos cargar los horarios. Cambia de fecha para intentar nuevamente." : "No hay horas disponibles para esta fecha. Prueba otro día."}</p></div>}<p className="field-hint"><Clock3 size={14}/> Horarios de Santiago de Chile.</p></div>}
    {step === 3 && <form id="booking-form" className="booking-step" onSubmit={submit}><div className="booking-mini-summary"><CalendarDays size={20}/><span>{service.name}<strong>{dateLabel(date, true)} · {time}</strong></span><button type="button" onClick={() => setStep(2)}>Cambiar</button></div><div className="form-grid"><label className="field">Nombre de tu mascota<input required minLength={2} maxLength={60} value={fields.petName} onChange={e => setFields({ ...fields, petName: e.target.value })} placeholder="¿Cómo se llama?"/></label>{!grooming && <label className="field">Especie<select value={species} onChange={e => setSpecies(e.target.value)}><option value="DOG">Perro</option><option value="CAT">Gato</option></select></label>}<label className="field">Nombre del tutor<input required autoComplete="name" minLength={2} maxLength={100} value={fields.name} onChange={e => setFields({ ...fields, name: e.target.value })} placeholder="Tu nombre completo"/></label><label className="field">Celular<input required type="tel" autoComplete="tel" maxLength={20} value={fields.phone} onChange={e => setFields({ ...fields, phone: e.target.value })} placeholder="+56 9 1234 5678"/></label><label className="field">Correo electrónico<input required type="email" autoComplete="email" maxLength={160} value={fields.email} onChange={e => setFields({ ...fields, email: e.target.value })} placeholder="tu@correo.cl"/></label><label className="field">¿Algo que debamos saber? <span className="optional">Opcional</span><textarea rows={2} maxLength={500} value={fields.notes} onChange={e => setFields({ ...fields, notes: e.target.value })} placeholder={grooming ? "Preferencias de corte o cuidados especiales…" : "Cuéntanos brevemente el motivo…"}/></label></div><label className="checkbox-field"><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)}/><span>Acepto las <Link href="/condiciones" target="_blank">condiciones de reserva y privacidad</Link>.</span></label><p className="field-hint">La solicitud quedará pendiente de confirmación del equipo.</p></form>}
    </motion.div></AnimatePresence>
    {error && <div role="alert" className="form-error">{error}{error.includes("ocupar") && <button onClick={() => { setStep(2); setTime(""); setTimes(times.filter(t => t !== time)); }}>Elegir otro horario</button>}</div>}<div className="booking-total"><div><strong>{service.name}</strong><span>Valor de ejemplo · {quote.duration} min</span></div><strong>{money(quote.price)}</strong></div><div className="booking-buttons">{step > 1 && <button className="button outline" onClick={() => { setStep(step - 1); setError(""); }} disabled={pending} aria-label="Volver al paso anterior"><ArrowLeft size={18}/></button>}{step < 3 ? <button key="continue" type="button" className="button dark full" onClick={next} disabled={step === 2 && (!time || loadingTimes)}>Continuar <ArrowRight size={18}/></button> : <button key="submit" type="submit" form="booking-form" className="button dark full" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={18}/> Guardando…</> : <>Solicitar reserva <ArrowRight size={18}/></>}</button>}</div><p className="secure-caption"><ShieldIcon/> Sin cobros en esta demostración.</p></section></div>;
}
function HeartIcon() { return <PawPrint size={19}/>; }
function ShieldIcon() { return <Check size={14}/>; }
