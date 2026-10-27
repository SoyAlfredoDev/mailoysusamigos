import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import { managedPetSchema, normalizedEmail, personSchema } from "./customer-validation";
import { newPetCode } from "./pet-code";
type Store = PrismaClient | Prisma.TransactionClient;
export class CustomerError extends Error {}
export const tokenDigest = (value: string) => createHash("sha256").update(value).digest("hex");

export async function syncCustomer(db: Store, userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user?.emailVerified || !user.active) throw new CustomerError("Verifica tu correo para continuar.");
  const contact = await db.customer.findUnique({ where: { email: user.email } });
  if (contact?.authUserId && contact.authUserId !== user.id) throw new CustomerError("No se pudo vincular la cuenta.");
  return db.customer.upsert({ where: { email: user.email },
    create: { name: user.name, lastName: user.lastName, phone: user.phone, email: user.email, authUserId: user.id },
    update: { name: user.name, lastName: user.lastName, phone: user.phone, authUserId: user.id },
  });
}

export async function createManagedUser(db: PrismaClient, raw: unknown) {
  const data = personSchema.parse(raw);
  return db.$transaction(async tx => {
    if (await tx.user.findUnique({ where: { email: data.email } })) throw new CustomerError("Ya existe una cuenta con ese correo.");
    const user = await tx.user.create({ data }); // No password is chosen or known by staff.
    await tx.customer.upsert({ where: { email: data.email }, create: { ...data, authUserId: user.id }, update: { ...data, authUserId: user.id } });
    return user;
  });
}

export async function createManagedPet(db: PrismaClient, raw: unknown, codeFactory = newPetCode) {
  const { customerIds, ...data } = managedPetSchema.parse(raw);
  if (await db.customer.count({ where: { id: { in: customerIds } } }) !== customerIds.length) throw new CustomerError("Selecciona tutores existentes.");
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      return await db.pet.create({ data: { ...data, code: codeFactory(), customerId: customerIds[0],
        guardians: { create: customerIds.map(customerId => ({ customerId, source: "ADMIN" })) },
      } });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
    }
  }
  throw new CustomerError("No se pudo asignar el código. Intenta nuevamente.");
}

export async function verifiedGuardian(db: Store, userId: string, petId: string) {
  const user = await db.user.findFirst({ where: { id: userId, active: true, emailVerified: true }, include: { customer: true } });
  if (!user?.customer || !await db.petGuardian.findUnique({ where: { petId_customerId: { petId, customerId: user.customer.id } } })) throw new CustomerError("No tienes permiso para compartir esta mascota.");
  return user;
}

export async function createPetInvitation(db: PrismaClient, userId: string, petId: string, emailValue: unknown) {
  const email = normalizedEmail.parse(emailValue);
  const token = randomBytes(32).toString("hex");
  const invitation = await db.$transaction(async tx => {
    const inviter = await verifiedGuardian(tx, userId, petId);
    if (inviter.email === email) throw new CustomerError("No puedes invitarte a ti mismo.");
    const now = new Date();
    const count = await tx.petInvitation.count({ where: { inviterId: userId, createdAt: { gt: new Date(now.getTime() - 3600000) } } });
    if (count >= 5) throw new CustomerError("Espera una hora antes de enviar más invitaciones.");
    await tx.petInvitation.updateMany({ where: { petId, email, acceptedAt: null, revokedAt: null }, data: { revokedAt: now } });
    return tx.petInvitation.create({ data: { petId, inviterId: userId, email, tokenHash: tokenDigest(token), expiresAt: new Date(now.getTime() + 48 * 3600000) } });
  });
  return { invitation, token };
}

export async function invitationForUser(db: Store, token: string, userId: string) {
  if (!/^[a-f0-9]{64}$/.test(token)) throw new CustomerError("La invitación no es válida o ha vencido.");
  const user = await db.user.findFirst({ where: { id: userId, active: true, emailVerified: true } });
  const invite = await db.petInvitation.findUnique({ where: { tokenHash: tokenDigest(token) }, include: { pet: true } });
  if (!user || !invite || invite.email !== user.email || invite.acceptedAt || invite.revokedAt || invite.expiresAt <= new Date()) throw new CustomerError("La invitación no está disponible para esta cuenta.");
  await verifiedGuardian(db, invite.inviterId, invite.petId);
  return invite;
}

export async function acceptPetInvitation(db: PrismaClient, token: string, userId: string) {
  return db.$transaction(async tx => {
    const invite = await invitationForUser(tx, token, userId);
    const contact = await syncCustomer(tx, userId);
    const claimed = await tx.petInvitation.updateMany({ where: { id: invite.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { acceptedAt: new Date(), acceptedById: userId } });
    if (claimed.count !== 1) throw new CustomerError("La invitación ya fue utilizada.");
    await tx.petGuardian.upsert({ where: { petId_customerId: { petId: invite.petId, customerId: contact.id } }, create: { petId: invite.petId, customerId: contact.id, source: "INVITATION" }, update: {} });
    return { name: invite.pet.name, code: invite.pet.code };
  });
}

export async function consumeCustomerLimit(db: PrismaClient, scope: string, identity: string, max: number, minutes = 15) {
  const key = "customer:" + scope + ":" + tokenDigest(identity);
  const now = new Date();
  await db.loginAttempt.updateMany({ where: { key, resetAt: { lte: now } }, data: { count: 0, resetAt: new Date(now.getTime() + minutes * 60000) } });
  const record = await db.loginAttempt.upsert({ where: { key }, create: { key, count: 1, resetAt: new Date(now.getTime() + minutes * 60000) }, update: { count: { increment: 1 } } });
  return record.count <= max;
}
