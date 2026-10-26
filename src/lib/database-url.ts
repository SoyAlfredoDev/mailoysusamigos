import { resolve } from "node:path";
export function databaseUrl(value = process.env.DATABASE_URL || "file:./prisma/dev.db") {
  if (value.startsWith("file:") && !value.startsWith("file:/")) return "file:" + resolve(value.slice(5));
  return value;
}
