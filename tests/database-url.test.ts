import { test } from "node:test";
import assert from "node:assert/strict";
import { databaseUrl, databaseAuthToken } from "../src/lib/database-url";

test("la integración Turso de Vercel proporciona la conexión sin renombrar secretos", () => {
  const keys = ["DATABASE_URL", "DATABASE_AUTH_TOKEN", "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "VERCEL"] as const;
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_AUTH_TOKEN;
    process.env.VERCEL = "1";
    process.env.TURSO_DATABASE_URL = "libsql://example.turso.io";
    process.env.TURSO_AUTH_TOKEN = "test-only-token";
    assert.equal(databaseUrl(), "libsql://example.turso.io");
    assert.equal(databaseAuthToken(), "test-only-token");
    assert.throws(() => databaseUrl("file:./prisma/dev.db"), /base remota persistente/);
    delete process.env.TURSO_DATABASE_URL;
    assert.throws(() => databaseUrl(), /base remota persistente/);
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
