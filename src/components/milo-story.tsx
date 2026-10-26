import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";
import { Reveal } from "./reveal";

export function MiloStory() {
  return <section className="container milo-story-section" aria-labelledby="milo-story-title">
    <Reveal className="milo-story-card">
      <div className="milo-story-photo"><Image src="/images/real/milo-esmoquin.webp" alt="Milo con su corbatín rojo frente al letrero de Milo y sus amigos" width={360} height={480} sizes="(min-width: 900px) 210px, 180px"/></div>
      <div className="milo-story-copy">
        <div className="eyebrow"><Heart size={14}/> EL CORAZÓN DE NUESTRA HISTORIA</div>
        <h2 id="milo-story-title">Él es <span>Milo.</span></h2>
        <p>El protagonista que da nombre a nuestra peluquería. Su compañía nos recuerda lo que más importa: que cada mascota se sienta querida y en buenas manos.</p>
        <a className="text-link" href="#ubicacion">Ven a conocernos <ArrowUpRight size={17}/></a>
      </div>
    </Reveal>
  </section>;
}
