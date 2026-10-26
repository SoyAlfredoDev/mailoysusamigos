import "dotenv/config";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { databaseUrl } from "./database-url";
const globalDb = globalThis as unknown as { db?: PrismaClient };
export const db = globalDb.db ?? new PrismaClient({
  adapter: new PrismaLibSql({
    url: databaseUrl(),
    authToken: process.env.DATABASE_AUTH_TOKEN || undefined,
  }),
});
if (process.env.NODE_ENV !== "production") globalDb.db = db;
