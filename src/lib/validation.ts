import { z } from "zod";
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre completo.").max(130),
  email: z.email("Revisa tu correo electrónico.").max(160).transform(v => v.toLowerCase()),
  phone: z.string().trim().regex(/^(?:\+?56\s?)?9(?:[\s-]?\d){8}$/, "Ingresa un celular chileno válido: +56 9 1234 5678."),
});
export const bookingSchema = z.object({
  idempotencyKey: z.uuid(),
  petId: z.string().min(1).max(80).optional(),
  serviceId: z.string().min(1).max(80), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  petName: z.string().trim().min(2, "Ingresa el nombre de tu mascota.").max(60),
  species: z.enum(["DOG", "CAT"]), size: z.enum(["SMALL", "MEDIUM", "LARGE", "GIANT"]).optional(),
  coat: z.enum(["SHORT", "MEDIUM", "LONG", "CURLY"]).optional(),
  notes: z.string().trim().max(500).default(""),
  accepted: z.literal(true, { error: "Acepta las condiciones para continuar." }),
  website: z.string().max(0).optional(),
  customer: customerSchema,
});
export const orderSchema = z.object({
  customer: customerSchema,
  idempotencyKey: z.uuid(),
  items: z.array(z.object({ productId: z.string().max(80), quantity: z.number().int().min(1).max(20) })).min(1).max(30),
  accepted: z.literal(true, { error: "Acepta las condiciones para continuar." }),
});
