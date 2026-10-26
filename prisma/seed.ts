import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { databaseUrl } from "../src/lib/database-url";
import { addDays, today, startAt, slotStarts } from "../src/lib/schedule";
const db = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl(), authToken: process.env.DATABASE_AUTH_TOKEN || undefined }) });
const products = [
  { id: "alimento-adulto", name: "Alimento para perro adulto", description: "Nutrición para acompañar sus aventuras de cada día. Producto de demostración; la marca y composición se definirán con el catálogo real.", category: "FOOD", pet: "DOG", detail: "Bolsa de 3 kg", price: 18990, stock: 18, image: "/images/food.webp", featured: true },
  { id: "mordedor", name: "Mordedor de algodón", description: "Una nueva excusa para jugar juntos. Cuerda de algodón con nudos; supervisa siempre el juego de tu mascota.", category: "ACCESSORIES", pet: "BOTH", detail: "Tamaño mediano", price: 5990, stock: 24, image: "/images/toy.webp", featured: true },
  { id: "shampoo", name: "Shampoo de cuidado suave", description: "Cuidado para su rutina de baño. La formulación e indicaciones del producto real se confirmarán con el proveedor.", category: "HYGIENE", pet: "DOG", detail: "Botella de 250 ml", price: 8990, stock: 8, image: "/images/shampoo.webp", featured: true },
  { id: "cama", name: "Cama de descanso suave", description: "Su rincón favorito para una buena siesta. Interior acolchado, borde envolvente y un diseño que combina con tu hogar.", category: "ACCESSORIES", pet: "BOTH", detail: "Diámetro de 60 cm", price: 29990, stock: 3, image: "/images/bed.webp", featured: true },
  { id: "alimento-gato", name: "Alimento para gato adulto", description: "Una opción para su alimentación cotidiana. Producto y fotografía referenciales; validar el catálogo real antes de la venta.", category: "FOOD", pet: "CAT", detail: "Bolsa de 2 kg", price: 16990, stock: 12, image: "/images/food.webp", featured: false },
];
for (const p of products) await db.product.upsert({ where: { id: p.id }, create: p, update: {} });
const services = [
  { id: "bano-corte", name: "Baño + corte", kind: "GROOMING", description: "Baño, corte a elección y secado. Un nuevo look con todo el cariño.", price: 25000, duration: 90 },
  { id: "bano", name: "Baño + cepillado", kind: "GROOMING", description: "Baño, cepillado y secado para renovar su pelaje.", price: 18000, duration: 60 },
  { id: "consulta", name: "Consulta general", kind: "VET", description: "Una evaluación de salud para perros y gatos.", price: 25000, duration: 30 },
  { id: "control", name: "Control veterinario", kind: "VET", description: "Seguimiento de una atención previa y revisión de su evolución.", price: 18000, duration: 30 },
];
for (const s of services) await db.service.upsert({ where: { id: s.id }, create: s, update: {} });
for (const r of [{ id: "grooming-a", name: "Peluquería · Equipo A", kind: "GROOMING" }, { id: "grooming-b", name: "Peluquería · Equipo B", kind: "GROOMING" }, { id: "vet", name: "Veterinaria", kind: "VET" }]) await db.resource.upsert({ where: { id: r.id }, create: r, update: {} });
if (process.env.NEXT_PUBLIC_DEMO === "true") {
  const customer = await db.customer.upsert({ where: { email: "cliente@ejemplo.test" }, create: { name: "Cliente de ejemplo", email: "cliente@ejemplo.test", phone: "+56912345678" }, update: {} });
  let day = today();
  if (new Date(day + "T12:00:00Z").getUTCDay() === 0) day = addDays(day, 1);
  for (const a of [{ ref: "DEMO-LUNA", pet: "Luna", service: "bano-corte", resource: "grooming-a", time: "10:00", duration: 90, price: 25000 }, { ref: "DEMO-NALA", pet: "Nala", service: "consulta", resource: "vet", time: "10:00", duration: 30, price: 25000 }, { ref: "DEMO-TOBY", pet: "Toby", service: "bano", resource: "grooming-b", time: "12:00", duration: 60, price: 18000 }, { ref: "DEMO-MAX", pet: "Max", service: "control", resource: "vet", time: "15:00", duration: 30, price: 18000 }]) {
    if (await db.appointment.findUnique({ where: { reference: a.ref } })) continue;
    const pet = await db.pet.create({ data: { name: a.pet, species: "DOG", size: "SMALL", customerId: customer.id } });
    const start = startAt(day, a.time);
    await db.appointment.create({ data: { reference: a.ref, date: day, time: a.time, startAt: start, endAt: new Date(start.getTime() + a.duration * 60000), status: a.pet === "Nala" ? "PENDING" : "CONFIRMED", price: a.price, serviceId: a.service, resourceId: a.resource, customerId: customer.id, petId: pet.id, slots: { create: slotStarts(start, a.duration).map(s => ({ resourceId: a.resource, startAt: s })) } } });
  }
}
console.log("Catálogo, servicios y agenda inicializados sin sobrescribir registros existentes.");
await db.$disconnect();
