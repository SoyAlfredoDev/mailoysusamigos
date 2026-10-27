import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Scissors, Stethoscope } from "lucide-react";
export const metadata = { title: "Agenda una visita" };
export default function Page() {
  return <div className="container page-section choose-page"><div className="eyebrow">SU PRÓXIMA VISITA EMPIEZA AQUÍ</div><h1>¿Qué necesita<br/><span>tu mejor amigo?</span></h1><p>Elige el servicio y encontremos una hora para ustedes.</p><div className="choose-grid">{[{ title: "Peluquería canina", text: "Baño, corte y un poquito de regaloneo.", image: "real/milo", href: "/peluqueria", icon: Scissors }, { title: "Atención veterinaria", text: "Cuidado y salud para perros y gatos.", image: "real/consultorio", href: "/veterinaria", icon: Stethoscope }].map(s => <Link href={s.href} className="choose-card" key={s.title}><Image src={"/images/" + s.image + ".webp"} alt="" width={800} height={550} sizes="(min-width: 900px) 440px, 100vw"/><div><s.icon size={27}/><h2>{s.title}</h2><p>{s.text}</p><span className="text-link">Encontrar mi hora <ArrowRight size={18}/></span></div></Link>)}</div><p className="demo-caption">Veterinaria: lunes a viernes con reserva de hora. Sábados, por orden de llegada. Puedes reservar sin crear una cuenta.</p></div>;
}
