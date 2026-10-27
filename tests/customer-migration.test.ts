import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createClient } from '@libsql/client';
test('migración conserva IDs antiguos y añade códigos y relaciones de tutor',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'milo-migration-'));
 const client=createClient({url:'file:'+join(dir,'migration.db')});
 try {
  await client.executeMultiple(readFileSync('prisma/migrations/20261026_initial/migration.sql','utf8'));
  await client.execute("INSERT INTO Customer (id,name,email,phone) VALUES ('legacy-contact','Ana','legacy@example.test','+56912345678')");
  await client.execute("INSERT INTO Pet (id,name,species,customerId) VALUES ('legacy-pet','Milo','DOG','legacy-contact'),('legacy-pet-two','Luna','CAT','legacy-contact')");
  await client.executeMultiple(readFileSync('prisma/migrations/20261027_users_pets/migration.sql','utf8'));
  await client.executeMultiple(readFileSync('prisma/migrations/20261027_booking_flow/migration.sql','utf8'));
  const pets=await client.execute('SELECT id,customerId,code FROM Pet ORDER BY id');
  assert.equal(pets.rows.length,2); assert.equal(pets.rows[0].id,'legacy-pet');
  assert.ok(pets.rows.every(p=>p.customerId==='legacy-contact' && /^M-\d{6}$/.test(String(p.code))));
  assert.equal(new Set(pets.rows.map(p=>p.code)).size,2);
  assert.equal((await client.execute('SELECT * FROM PetGuardian')).rows.length,2);
  assert.equal((await client.execute('PRAGMA foreign_key_check')).rows.length,0);
 } finally {client.close();rmSync(dir,{recursive:true,force:true});}
});
