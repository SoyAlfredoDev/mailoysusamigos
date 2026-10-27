import { z } from "zod";
export const personName = z.string().trim().min(2).max(60);
export const personPhone = z.string().trim().regex(/^(?:\+?56\s?)?9(?:[\s-]?\d){8}$/, "Ingresa un celular chileno válido.");
export const normalizedEmail = z.string().trim().toLowerCase().pipe(z.email().max(160));
export const personSchema = z.object({ name: personName, lastName: personName, phone: personPhone, email: normalizedEmail });
export const managedPetSchema = z.object({
  name: z.string().trim().min(2).max(60), species: z.enum(["DOG", "CAT"]),
  customerIds: z.array(z.string().min(1).max(80)).length(1),
});
export function safeReturnTo(value?: string | null) {
  if (value === "/veterinaria" || value === "/peluqueria") return value;
  return value && /^\/(?:invitaciones\/mascota\?token=[a-f0-9]{64}|compartir-mascota\/M-[A-Z0-9]{6,10})$/.test(value) ? value : "/mi-cuenta";
}
