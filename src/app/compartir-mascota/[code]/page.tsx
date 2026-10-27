import { requireCustomer } from "@/lib/customer-auth";
import { verifiedGuardian } from "@/lib/customer-core";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Brand } from "@/components/site-shell";
import { PetInvitationForm } from "@/components/pet-invitation-form";
export const metadata = { title: "Invita a otro tutor", referrer: "no-referrer" as const };
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const user = await requireCustomer("/compartir-mascota/" + code);
  const pet = await db.pet.findUnique({ where: { code } });
  if (!pet) notFound();
  try { await verifiedGuardian(db, user.id, pet.id); } catch { notFound(); }
  return <div className="customer-auth-page"><Brand/><section className="customer-auth-card"><div className="eyebrow">SU CUIDADO TAMBIÉN SE COMPARTE</div><h1>Invita a otro tutor.</h1><p className="account-intro">Comparte el cuidado de <strong>{pet.name}</strong> · {pet.code}.</p><PetInvitationForm code={pet.code}/></section></div>;
}
