import Link from "next/link";
import { PawPrint } from "lucide-react";
export default function NotFound() { return <div className="container page-section empty-state"><PawPrint size={46}/><h1>Por aquí no era.</h1><p>Esa página no está disponible. Volvamos con nuestros amigos.</p><Link href="/" className="button dark">Volver al inicio</Link></div>; }
