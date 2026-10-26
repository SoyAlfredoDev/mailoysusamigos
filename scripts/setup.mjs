import { existsSync, writeFileSync, closeSync, openSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
if (!existsSync(".env")) {
  const password = randomBytes(15).toString("base64url");
  writeFileSync(".env", [
    'DATABASE_URL="file:' + resolve("prisma/dev.db") + '"',
    'DATABASE_AUTH_TOKEN=""',
    'SESSION_SECRET="' + randomBytes(48).toString("base64url") + '"',
    'ADMIN_EMAIL="admin@milo.local"',
    'ADMIN_PASSWORD="' + password + '"',
    'NEXT_PUBLIC_DEMO="true"',
    ""
  ].join("\n"), { mode: 0o600 });
  console.log("Configuración local creada. Credenciales administrativas en .env.");
}
if (!existsSync("prisma/dev.db")) closeSync(openSync("prisma/dev.db", "a"));
