import { adminConfigured } from "@/lib/auth";
import { Login } from "@/components/login";
export const metadata = { title: "Acceso del equipo" };
export default function Page() { return <main id="contenido"><Login configured={adminConfigured()}/></main>; }
