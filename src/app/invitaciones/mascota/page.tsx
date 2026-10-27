import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { invitationForUser } from "@/lib/customer-core";
import { db } from "@/lib/db";
import { Brand } from "@/components/site-shell";
import { PetInvitationForm } from "@/components/pet-invitation-form";
export const metadata = { title: "Invitación de tutor", referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token || "";
  const user = await requireCustomer("/invitaciones/mascota?token=" + token);
  let invite;
  try { invite = await invitationForUser(db, token, user.id); } catch { /* Do not disclose the intended recipient or pet. */ }
  return <div className="customer-auth-page"><Brand/><section className="customer-auth-card"><div className="eyebrow">MÁS CARIÑO PARA ELLOS</div><h1>{invite ? "Te invitaron a ser tutor." : "Invitación no disponible."}</h1>{invite ? <><p className="account-intro">Puedes asociar tu cuenta a <strong>{invite.pet.name}</strong> · {invite.pet.code}. No se realizará ningún cambio hasta que aceptes.</p><PetInvitationForm token={token}/></> : <><p className="account-intro">Ingresa con el mismo correo que recibió la invitación. Si el enlace venció o ya fue utilizado, solicita uno nuevo al tutor.</p><Link className="button outline" href="/mi-cuenta">Volver a la bienvenida</Link></>}</section></div>;
}
