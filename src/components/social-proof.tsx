import { ArrowUpRight, Instagram, MessageCircle, Star } from "lucide-react";
import { Reveal } from "./reveal";
import { getGoogleReviews, getInstagramPosts, googleMapsUrl, instagramProfile, socialVerifiedAt } from "@/lib/social-content";
import { InstagramEmbed } from "./instagram-embed";

function Stars({ rating }: { rating: number }) {
  return <span className="review-stars" aria-label={rating + " de 5 estrellas"}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill={i < Math.round(rating) ? "currentColor" : "none"} aria-hidden="true"/>)}</span>;
}

export async function SocialProof() {
  const [instagram, google] = await Promise.all([getInstagramPosts(), getGoogleReviews()]);
  return <>
    <section className="container reviews-section" aria-labelledby="reviews-title">
      <Reveal className="section-heading"><div><div className="eyebrow">EL CARIÑO TAMBIÉN SE CUENTA</div><h2 id="reviews-title">Sus familias <span>nos cuentan.</span></h2></div><a href={googleMapsUrl} target="_blank" rel="noreferrer" className="text-link">Ver todas en Google <ArrowUpRight size={17}/></a></Reveal>
      <p className="social-selection-note">{google.automatic ? "Reseñas seleccionadas por Google por relevancia." : "Selección de reseñas destacadas. Puedes consultar todas las opiniones en la ficha de Google."}</p><div className="reviews-layout"><Reveal className="google-rating-card"><span className="google-maps-attribution" translate="no">Google Maps</span><div className="google-score">{google.rating.toLocaleString("es-CL", { minimumFractionDigits: 1 })}<span>/ 5</span></div><Stars rating={google.rating}/><p>{google.count} opiniones en Google</p><a href={googleMapsUrl} target="_blank" rel="noreferrer">Conocer sus experiencias <ArrowUpRight size={15}/></a><small>{google.automatic ? "Datos consultados en Google." : "Datos verificados el " + socialVerifiedAt + "."}</small></Reveal>
      <div className="review-cards">{google.reviews.map((review, i) => <Reveal key={review.author + i} delay={i * .06} className="google-review"><div className="review-top"><span className="review-avatar" aria-hidden="true">{review.author.split(" ").map(n => n[0]).slice(0, 2).join("")}</span><div>{review.authorUrl ? <a href={review.authorUrl} target="_blank" rel="noreferrer"><h3>{review.author}</h3></a> : <h3>{review.author}</h3>}<span>Opinión en Google</span></div><MessageCircle size={19}/></div><Stars rating={review.rating}/><blockquote>“{review.text}”</blockquote><div className="review-footer"><span>{review.excerpt ? "Fragmento de reseña" : review.dateLabel}</span><a href={review.url} target="_blank" rel="noreferrer" aria-label={"Ver reseña de " + review.author + " en Google"}>Ver en Google <ArrowUpRight size={13}/></a></div></Reveal>)}</div></div>
    </section>
    <section className="container instagram-section" aria-labelledby="instagram-title">
      <Reveal className="section-heading"><div><div className="eyebrow"><Instagram size={14}/> @MILOYSUSAMIGOSCL</div><h2 id="instagram-title">Así se vive <span>en Milo.</span></h2><p className="social-intro">Nuestros amigos, sus nuevos looks y un poquito de nuestro día a día.</p></div><a href={instagramProfile} target="_blank" rel="noreferrer" className="text-link">Seguir en Instagram <ArrowUpRight size={17}/></a></Reveal>
      <p className="instagram-swipe-hint">Desliza para ver las últimas publicaciones <ArrowUpRight size={13}/></p><div className="instagram-grid">{instagram.posts.map((post, i) => <Reveal key={post.code} delay={i * .06} className="instagram-card"><InstagramEmbed post={post}/><a href={post.url} target="_blank" rel="noreferrer"><span>{post.publishedAt}</span><span>Abrir publicación <ArrowUpRight size={14}/></span></a></Reveal>)}</div>
      <p className="social-source-note">Publicaciones originales de Instagram{instagram.automatic ? " · Últimas publicaciones actualizadas desde la cuenta." : " · Las más recientes verificadas el " + socialVerifiedAt + "."} Si Instagram limita la vista, puedes abrir cada publicación en su perfil.</p>
    </section>
  </>;
}
