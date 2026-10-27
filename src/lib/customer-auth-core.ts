import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "better-auth/adapters/prisma";
import type { PrismaClient } from "@/generated/prisma/client";
import type { AppMail } from "./customer-email";
import { personName, personPhone, personSchema } from "./customer-validation";
import { syncCustomer } from "./customer-core";

export function createCustomerAuth(db: PrismaClient, config: { secret: string; baseURL: string; mail: (mail: AppMail) => Promise<void>; backgroundTask?: (task: Promise<unknown>) => void }) {
  return betterAuth({
    appName: "Milo y sus amigos", baseURL: config.baseURL, secret: config.secret,
    database: prismaAdapter(db, { provider: "sqlite", transaction: true }),
    trustedOrigins: [config.baseURL],
    emailAndPassword: {
      enabled: true, requireEmailVerification: true, autoSignIn: false,
      minPasswordLength: 12, maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 1800, revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => config.mail({ to: user.email, subject: "Elige tu contraseña de Milo", text: `Hola ${user.name}.\nUsa este enlace para crear o restablecer tu contraseña. Vence en 30 minutos y solo puede usarse una vez.\n${url}\nSi el equipo creó tu cuenta, este paso también confirma tu correo.` }),
      onPasswordReset: async ({ user }) => {
        // Possession of the single-use recovery link proves control of this mailbox.
        await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
        const current = await db.user.findUniqueOrThrow({ where: { id: user.id } });
        if (current.active) await syncCustomer(db, user.id);
      },
    },
    emailVerification: {
      sendOnSignUp: true, sendOnSignIn: false, autoSignInAfterVerification: false, expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => config.mail({ to: user.email, subject: "Confirma tu correo en Milo", text: `Hola ${user.name}.\nConfirma tu correo para activar el acceso a tu cuenta. Este enlace vence en una hora.\n${url}` }),
      afterEmailVerification: async user => { await syncCustomer(db, user.id); },
    },
    user: { additionalFields: {
      lastName: { type: "string", required: true, validator: { input: personName } },
      phone: { type: "string", required: true, validator: { input: personPhone } },
      active: { type: "boolean", required: false, defaultValue: true, input: false, returned: false },
    } },
    session: { expiresIn: 8 * 3600, updateAge: 3600, cookieCache: { enabled: false } },
    verification: { storeIdentifier: "hashed" },
    account: { accountLinking: { enabled: false } },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 40,
      customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 3600, max: 5 }, "/request-password-reset": { window: 3600, max: 5 }, "/send-verification-email": { window: 3600, max: 5 } },
    },
    advanced: { cookiePrefix: "milo_customer", useSecureCookies: config.baseURL.startsWith("https://"),
      ...(config.backgroundTask ? { backgroundTasks: { handler: config.backgroundTask } } : {}),
    },
    databaseHooks: {
      user: { create: { before: async user => ({ data: { ...user, ...personSchema.parse(user), active: true, emailVerified: false } }) } },
      session: { create: { before: async session => {
        const user = await db.user.findUnique({ where: { id: session.userId } });
        if (!user?.active || !user.emailVerified) return false;
      } } },
    },
    logger: { disabled: process.env.NODE_ENV === "test" },
  });
}
