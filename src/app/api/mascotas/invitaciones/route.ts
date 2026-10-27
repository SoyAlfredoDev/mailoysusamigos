import { z } from "zod";
import { currentCustomer, customerBaseURL } from "@/lib/customer-auth";
import { acceptPetInvitation, createPetInvitation, CustomerError, verifiedGuardian } from "@/lib/customer-core";
import { db } from "@/lib/db";
import { sendCustomerEmail } from "@/lib/customer-email";
import { hasSameOrigin } from "@/lib/request-origin";
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
  const user = await currentCustomer(request.headers);
  if (!user) return Response.json({ error: "Inicia sesión con tu correo verificado." }, { status: 401 });
  try {
    const body = await request.json();
    if (body.action === "accept") {
      const token = z.string().regex(/^[a-f0-9]{64}$/).parse(body.token);
      const pet = await acceptPetInvitation(db, token, user.id);
      return Response.json({ message: `Ya estás asociado a ${pet.name} (${pet.code}).` });
    }
    if (body.action === "revoke") {
      const id = z.string().min(1).max(80).parse(body.id);
      const invite = await db.petInvitation.findFirst({ where: { id, inviterId: user.id, acceptedAt: null } });
      if (!invite) throw new CustomerError("La invitación no está disponible.");
      await verifiedGuardian(db, user.id, invite.petId);
      await db.petInvitation.updateMany({ where: { id, acceptedAt: null }, data: { revokedAt: new Date() } });
      return Response.json({ message: "Invitación anulada." });
    }
    if (body.action !== "invite") return new Response(null, { status: 400 });
    const code = z.string().regex(/^M-[A-Z0-9]{6,10}$/).parse(body.code);
    const pet = await db.pet.findUnique({ where: { code } });
    if (!pet) throw new CustomerError("Mascota no disponible.");
    const { invitation, token } = await createPetInvitation(db, user.id, pet.id, body.email);
    try {
      await sendCustomerEmail({ to: invitation.email, subject: "Te invitaron a ser tutor en Milo", text: `${user.name} te invita a compartir el cuidado de ${pet.name}, código ${pet.code}.\nEntra con la cuenta del correo al que recibiste esta invitación y acepta para asociarte. Si no tienes cuenta, podrás crearla.\n${customerBaseURL()}/invitaciones/mascota?token=${token}\nEl enlace vence en 48 horas. La asociación solo se realiza cuando la aceptas.` });
    } catch {
      await db.petInvitation.update({ where: { id: invitation.id }, data: { revokedAt: new Date() } });
      return Response.json({ error: "No se pudo enviar el correo. La invitación quedó anulada; intenta más tarde." }, { status: 503 });
    }
    return Response.json({ message: "Invitación enviada. La otra persona debe aceptar desde su correo." });
  } catch (error) {
    if (error instanceof CustomerError) return Response.json({ error: error.message }, { status: 403 });
    return Response.json({ error: "No se pudo completar la solicitud. Revisa los datos." }, { status: 400 });
  }
}
