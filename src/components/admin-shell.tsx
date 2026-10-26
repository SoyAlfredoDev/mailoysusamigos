"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ChevronRight, House, LogOut, Package, PawPrint, Settings2, ShoppingBag, UsersRound } from "lucide-react";
import { logout } from "@/app/acceso/actions";
import { Brand } from "./site-shell";
import { PageEntrance } from "./motion-system";
const links = [
  { href: "/admin", label: "Agenda", icon: CalendarDays },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/clientes", label: "Clientes y mascotas", icon: UsersRound },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings2 },
];
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className="admin-app"><aside className="admin-sidebar"><Link href="/" className="admin-brand"><PawPrint size={31}/><span>Milo<span>y sus amigos.</span></span></Link><p className="admin-sidebar-label">ADMINISTRACIÓN</p><nav aria-label="Administración">{links.map(l => <Link href={l.href} key={l.href} className={path === l.href ? "active" : ""}><l.icon size={18}/>{l.label}{path === l.href && <span className="sidebar-active-dot"/>}</Link>)}</nav><div className="sidebar-bottom"><Link href="/" className="sidebar-store"><House size={18}/><span>Ver el sitio<small>Milo y sus amigos</small></span><ChevronRight size={15}/></Link><form action={logout}><button><LogOut size={16}/> Cerrar sesión</button></form></div></aside><div className="admin-main"><header className="admin-topbar"><div className="admin-desktop-breadcrumb">Milo y sus amigos <ChevronRight size={12}/> Panel del equipo</div><div className="admin-mobile-brand"><Brand small/></div><div className="admin-topbar-right"><span className="demo-pill">Demostración</span><span className="avatar">M</span><span className="admin-user">Equipo Milo<small>Administrador</small></span><form action={logout}><button className="icon-button" aria-label="Cerrar sesión"><LogOut size={17}/></button></form></div></header><main id="contenido" className="admin-content"><PageEntrance>{children}</PageEntrance></main><nav className="admin-bottom-nav" aria-label="Panel móvil">{links.map(l => <Link key={l.href} href={l.href} className={path === l.href ? "active" : ""}><l.icon size={19}/><span>{l.label === "Clientes y mascotas" ? "Clientes" : l.label === "Configuración" ? "Ajustes" : l.label}</span></Link>)}</nav></div></div>;
}
