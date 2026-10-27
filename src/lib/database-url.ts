import { resolve } from "node:path";
export function databaseUrl(value = process.env.DATABASE_URL || process.env.TURSO_DATABASE_URL || "file:./prisma/dev.db") {
  if (process.env.VERCEL === "1" && value.startsWith("file:")) {
    throw new Error("Configura TURSO_DATABASE_URL o DATABASE_URL con una base remota persistente en Vercel.");
  }
  if (value.startsWith("file:") && !value.startsWith("file:/")) return "file:" + resolve(value.slice(5));
  return value;
}

export function databaseAuthToken() {
  return process.env.DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined;
}
