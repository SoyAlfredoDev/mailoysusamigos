import { requireCustomer } from "@/lib/customer-auth";
import { CustomerSignOut } from "@/components/customer-sign-out";
import { Brand } from "@/components/site-shell";
import { Heart } from "lucide-react";
export const metadata = { title: "Bienvenido a Milo" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await requireCustomer();
  return <div className="customer-auth-page"><Brand/><section className="customer-auth-card welcome-card"><div className="account-symbol"><Heart size={28}/></div><div className="eyebrow">YA ERES PARTE DE LA FAMILIA</div><h1>¡Hola, {user.name}!</h1><p className="account-intro">Qué bueno tenerte aquí. Bienvenido a Milo y sus amigos.</p><CustomerSignOut/></section></div>;
}
