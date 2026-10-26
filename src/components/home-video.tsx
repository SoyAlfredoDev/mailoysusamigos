import { Reveal } from "./reveal";
import "./home-video.css";

export function HomeVideo() {
  return (
    <section className="container home-video-section" id="conoce-milo" aria-labelledby="home-video-title">
      <Reveal className="home-video-heading">
        <div>
          <div className="eyebrow">PUERTAS ABIERTAS, COLITAS FELICES</div>
          <h2 id="home-video-title">Un vistazo a <span>Milo.</span></h2>
        </div>
        <p>Conoce nuestro espacio y el cariño que acompaña cada visita.</p>
      </Reveal>
      <div className="home-video-frame">
        <video
          className="home-video"
          width={1280}
          height={720}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="metadata"
          poster="/videos/milo-local-poster.jpg"
          aria-label="Un recorrido por Milo y sus amigos: el local, la peluquería y el petshop"
        >
          <source src="/videos/milo-local.mp4" type="video/mp4" />
          Tu navegador no puede reproducir este video. <a href="/videos/milo-local.mp4">Abrir video de Milo y sus amigos</a>.
        </video>
      </div>
    </section>
  );
}
