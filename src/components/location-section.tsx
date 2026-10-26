import { ArrowUpRight, MapPin, Navigation } from "lucide-react";
import { googleMapsUrl } from "@/lib/social-content";
import { locationMapEmbed } from "@/lib/location";
import { LocationGallery } from "./location-gallery";
import { Reveal } from "./reveal";
import "./location-section.css";

export function LocationSection() {
  return <section className="container location-section" id="ubicacion" aria-labelledby="location-title">
    <Reveal className="location-heading"><div><div className="eyebrow">UN MISMO LUGAR PARA CUIDARLOS</div><h2 id="location-title">Ven a <span>conocernos.</span></h2><p>Su próxima visita empieza aquí, en el corazón de Santiago.</p></div><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="button dark"><Navigation size={17}/> Cómo llegar <ArrowUpRight size={16}/></a></Reveal>
    <div className="location-layout">
      <Reveal className="location-map-card">
        <iframe src={locationMapEmbed} title="Google Maps · Milo y sus amigos, Mario Alvo Hassan 1489, Santiago" loading="eager" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>
        <div className="location-address"><span className="location-pin"><MapPin size={20}/></span><div><strong>Mario Alvo Hassan 1489</strong><span>Santiago, Región Metropolitana</span></div><a href="https://wa.me/56937229564" target="_blank" rel="noreferrer" aria-label="Consultar al local por WhatsApp">¿Nos visitas? <ArrowUpRight size={15}/></a></div>
      </Reveal>
      <Reveal className="location-gallery-card" delay={.08}><LocationGallery/></Reveal>
    </div>
    <p className="location-photo-note">Nuestro espacio, tal como es. Toca una foto para verla completa.</p>
  </section>;
}
