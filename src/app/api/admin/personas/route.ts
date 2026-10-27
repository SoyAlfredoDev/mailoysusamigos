import { z } from "zod";
import { adminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { createManagedUser, createManagedPet, consumeCustomerLimit, CustomerError } from "@/lib/customer-core";
import { customerBaseURL, getCustomerAuth } from "@/lib/customer-auth";
import { hasSameOrigin } from "@/lib/request-origin";
import { revalidatePath } from "next/cache";
export async function POST(request: Request) {
  if (!hasSameOrigin(request)) return Response.json({ error: "Solicitud no permitida." }, { status: 403 });
  const session = await adminSession();
  if (!process.env.ADMIN_EMAIL || !session.admin || session.email !== process.env.ADMIN_EMAIL) return Response.json({ error: "Acceso no autorizado." }, { status: 401 });
  try {
    const body = await request.json();
    let message = "Cambios guardados.";
    if (body.action === "create-user") {
      const user = await createManagedUser(db, body);
      await getCustomerAuth().api.requestPasswordReset({ body: { email: user.email, redirectTo: customerBaseURL() + "/restablecer" }, headers: request.headers });
      message = "Cuenta creada. Se solicitó el correo para que la persona elija su contraseña.";
    } else if (body.action === "activate") {
      const id = z.string().min(1).max(80).parse(body.id);
      const user = await db.user.findUniqueOrThrow({ where: { id } });
      if (!user.active) throw new CustomerError("La cuenta está deshabilitada.");
      if (!await consumeCustomerLimit(db, "staff-activation", id, 3, 60)) throw new CustomerError("Espera antes de reenviar otro correo.");
      await getCustomerAuth().api.requestPasswordReset({ body: { email: user.email, redirectTo: customerBaseURL() + "/restablecer" }, headers: request.headers });
      message = "Se solicitó un nuevo correo de activación o recuperación.";
    } else if (body.action === "set-active") {
      const { id, active } = z.object({ id: z.string().min(1).max(80), active: z.boolean() }).parse(body);
      await db.$transaction(async tx => {
        await tx.user.update({ where: { id }, data: { active } });
        await tx.session.deleteMany({ where: { userId: id } });
      });
    } else if (body.action === "create-pet") {
      const pet = await createManagedPet(db, body);
      message = `Mascota creada con código ${pet.code}.`;
    } else return Response.json({ error: "Acción no disponible." }, { status: 400 });
    revalidatePath("/admin/clientes");
    return Response.json({ message });
  } catch (error) {
    if (error instanceof CustomerError) return Response.json({ error: error.message }, { status: 400 });
    if (error instanceof z.ZodError) return Response.json({ error: "Revisa los campos obligatorios y el celular." }, { status: 400 });
    return Response.json({ error: "No se pudo completar la operación. Revisa el listado antes de reintentar." }, { status: 500 });
  }
}
