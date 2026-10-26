"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Expand, X } from "lucide-react";
import { locationPhotos } from "@/lib/location";

export function LocationGallery() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState(0);
  const photo = locationPhotos[active];
  function move(direction: number) {
    setActive(current => (current + direction + locationPhotos.length) % locationPhotos.length);
  }
  return <>
    <div className="location-gallery" aria-label="Fotografías de nuestro local">
      {locationPhotos.map((item, index) => <button key={item.src} type="button" className={"location-photo " + (index === 0 ? "location-photo-main" : "")} aria-label={"Ampliar " + item.title} onClick={() => { setActive(index); dialog.current?.showModal(); }}>
        <Image src={item.src} alt={item.alt} fill sizes={index === 0 ? "(min-width: 900px) 48vw, 90vw" : "(min-width: 900px) 24vw, 45vw"}/>
        <span className="location-photo-label">{item.title}</span>
        <span className="location-photo-expand" aria-hidden="true"><Expand size={15}/></span>
      </button>)}
    </div>
    <dialog ref={dialog} className="location-lightbox" aria-label="Fotografías de Milo y sus amigos" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <div className="location-lightbox-content">
        <button type="button" className="lightbox-close icon-button" aria-label="Cerrar fotografía" onClick={() => dialog.current?.close()} autoFocus><X size={23}/></button>
        <div className="location-lightbox-image"><Image key={photo.src} src={photo.src} alt={photo.alt} fill sizes="(min-width: 900px) 80vw, 95vw"/></div>
        <div className="lightbox-footer"><button type="button" className="icon-button" aria-label="Foto anterior" onClick={() => move(-1)}><ArrowLeft size={19}/></button><div><strong>{photo.title}</strong><span>Nuestro local · {active + 1} de {locationPhotos.length}</span></div><button type="button" className="icon-button" aria-label="Foto siguiente" onClick={() => move(1)}><ArrowRight size={19}/></button></div>
      </div>
    </dialog>
  </>;
}
