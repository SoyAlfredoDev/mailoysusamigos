import type { Metadata } from "next";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "@fontsource/pacifico/latin-400.css";
import { CartProvider } from "@/components/cart-provider";
import { SiteShell } from "@/components/site-shell";
import { MotionProvider } from "@/components/motion-system";
import "./globals.css";
import "./motion.css";
import "./real-photos.css";
import "./branding.css";
import "./admin-branding.css";
import "./public-experience.css";
import "./customer-accounts.css";
export const metadata: Metadata = {
  title: { default: "Milo y sus amigos · Peluquería, veterinaria y petshop", template: "%s · Milo y sus amigos" },
  description: "Cuidado, salud y todo para tu mascota en un mismo lugar. Conoce nuestra peluquería canina, agenda una atención veterinaria y explora el petshop.",
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-CL"><body><a href="#contenido" className="skip-link">Saltar al contenido</a><MotionProvider><CartProvider><SiteShell>{children}</SiteShell></CartProvider></MotionProvider></body></html>;
}
