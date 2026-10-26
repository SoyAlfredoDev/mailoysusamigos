"use client";
import { useState } from "react";
import { ArrowUpRight, Instagram } from "lucide-react";
import type { InstagramPost } from "@/lib/social-content";

export function InstagramEmbed({ post }: { post: InstagramPost }) {
  const [loaded, setLoaded] = useState(false);
  return <div className={"instagram-embed" + (loaded ? " is-loaded" : "")}>
    {!loaded && <div className="instagram-loading"><Instagram size={30}/><strong>@miloysusamigoscl</strong><p>Cargando la publicación original<br/>desde Instagram.</p><a href={post.url} target="_blank" rel="noreferrer">Ver en Instagram <ArrowUpRight size={15}/></a></div>}
    <iframe src={"https://www.instagram.com/p/" + post.code + "/embed/"} title={"Publicación real de Milo y sus amigos · " + post.publishedAt} loading="lazy" onLoad={() => setLoaded(true)} allow="encrypted-media; fullscreen" referrerPolicy="strict-origin-when-cross-origin"/>
  </div>;
}
