"use client";
import Link from "next/link";
import { Pause, Play, Sparkles } from "lucide-react";
import { useState } from "react";

export function PromotionRibbon() {
  const [paused, setPaused] = useState(false);
  return <section className={"promotion-ribbon" + (paused ? " is-paused" : "")} aria-label="Promoción de inauguración de la web">
    <Link href="/peluqueria" className="promotion-link" aria-label="Inauguración de nuestra web: hasta un 10% de descuento en peluquería. Consulta las condiciones al agendar.">
      <div className="promotion-track" aria-hidden="true">
        {[0, 1].map(group => <div className="promotion-group" key={group}>
          {[0, 1, 2].map(item => <span className="promotion-message" key={item}><Sparkles size={13}/><strong>¡Estrenamos web!</strong><span>Hasta un 10% de descuento en peluquería</span><span className="promotion-separator">✦</span><span>Consulta las condiciones al agendar</span></span>)}
        </div>)}
      </div>
    </Link>
    <button type="button" className="promotion-pause" onClick={() => setPaused(!paused)} aria-label={paused ? "Reanudar cinta de promociones" : "Pausar cinta de promociones"} aria-pressed={paused}>{paused ? <Play size={13}/> : <Pause size={13}/>}</button>
  </section>;
}
