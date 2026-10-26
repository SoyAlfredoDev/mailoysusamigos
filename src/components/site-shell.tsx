"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PageEntrance } from "./motion-system";
import { ArrowUpRight, CalendarDays, Heart, House, Menu, PawPrint, ShoppingBag, ShoppingCart, X, Instagram, ArrowRight } from "lucide-react";
import { useCart } from "./cart-provider";
export function Brand({ small = false }: { small?: boolean }) {
  return <Link href="/" className={"brand " + (small ? "small" : "")} aria-label="Milo y sus amigos, inicio"><Image src="/images/logo.jpg" alt="" width={68} height={68} /><span>Milo<span>y sus amigos<span className="brand-dot">.</span></span></span></Link>;
}
export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const { count } = useCart();
  if (pathname.startsWith("/admin") || pathname === "/acceso") return <>{children}</>;
  const links = [{ href: "/tienda", label: "Tienda" }, { href: "/peluqueria", label: "Peluquería" }, { href: "/veterinaria", label: "Veterinaria" }, { href: "/#nosotros", label: "Nosotros" }];
  return <>
    <div className="topbar"><PawPrint size={13} /> Un mismo lugar. Todo su bienestar. <span>Hecho con cariño, para ellos.</span></div>
    <header className="site-header"><div className="container header-inner"><Brand /><nav className="desktop-nav" aria-label="Navegación principal">{links.map(l => <Link key={l.href} className={pathname === l.href ? "active" : ""} href={l.href}>{l.label}</Link>)}</nav><div className="header-actions"><Link href="/carrito" className="icon-button cart-icon" aria-label={"Carrito, " + count + " productos"}><ShoppingBag size={21} />{count > 0 && <motion.span key={count} initial={{scale:.65}} animate={{scale:1}} transition={{type:"spring",stiffness:400,damping:19}} className="cart-count">{count}</motion.span>}</Link><Link href="/agendar" className="button dark header-book"><CalendarDays size={16} /> Agendar hora</Link><button className="icon-button mobile-menu" onClick={() => setMenu(!menu)} aria-label={menu ? "Cerrar menú" : "Abrir menú"} aria-expanded={menu}>{menu ? <X /> : <Menu />}</button></div></div>
      <AnimatePresence initial={false}>{menu && <motion.nav key="mobile-menu" className="mobile-menu-panel container" aria-label="Menú móvil" initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.22}} style={{overflow:"hidden"}}>{links.map(l => <Link key={l.href} onClick={() => setMenu(false)} href={l.href}>{l.label}<ArrowUpRight size={18}/></Link>)}<Link href="/agendar" onClick={() => setMenu(false)}>Agendar una hora<CalendarDays size={18}/></Link></motion.nav>}</AnimatePresence>
    </header>
    <main id="contenido"><PageEntrance>{children}</PageEntrance></main>
    <footer className="site-footer"><div className="container footer-grid"><div><Brand /><p>Su bienestar, nuestra mejor amistad.<br/>Peluquería, veterinaria y petshop en un mismo lugar.</p><a href="https://www.instagram.com/miloysusamigoscl/" target="_blank" rel="noreferrer" className="social-link"><Instagram size={18}/> @miloysusamigoscl <ArrowUpRight size={14}/></a></div><div><h3>Para tu mejor amigo</h3><Link href="/tienda">Comprar productos</Link><Link href="/peluqueria">Peluquería canina</Link><Link href="/veterinaria">Atención veterinaria</Link></div><div><h3>Estamos para ayudarte</h3><a href="https://wa.me/56937229564" target="_blank" rel="noreferrer">Hablemos por WhatsApp <ArrowUpRight size={14}/></a><Link href="/condiciones">Condiciones y privacidad</Link><Link href="/admin">Acceso del equipo <ArrowRight size={14}/></Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Milo y sus amigos</span><span><Heart size={13}/> Cuidamos lo que más quieres.</span></div></footer>
    <nav className="bottom-nav" aria-label="Navegación móvil">{[{ href: "/", label: "Inicio", icon: House }, { href: "/tienda", label: "Tienda", icon: ShoppingBag }, { href: "/agendar", label: "Agendar", icon: CalendarDays }, { href: "/carrito", label: count ? "Carrito (" + count + ")" : "Carrito", icon: ShoppingCart }].map(l => <Link key={l.href} href={l.href} className={pathname === l.href || (l.href === "/agendar" && ["/peluqueria", "/veterinaria"].includes(pathname)) ? "active" : ""}><l.icon size={21}/><span>{l.label}</span></Link>)}</nav>
  </>;
}
