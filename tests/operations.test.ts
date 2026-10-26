import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
const temp = mkdtempSync(join(tmpdir(),"milo-tests-"));
copyFileSync(resolve("prisma/dev.db"),join(temp,"test.db"));
process.env.DATABASE_URL = "file:" + join(temp,"test.db");
const { db } = await import("../src/lib/db");
const { createBooking, createOrder, availableTimes } = await import("../src/lib/operations");
const { today, addDays, scheduleTimes, startAt } = await import("../src/lib/schedule");
let date = addDays(today(),2);
if (new Date(date+"T12:00:00Z").getUTCDay()===0) date=addDays(date,1);
const customer = { name:"Prueba automatizada",email:"automated@example.test",phone:"+56912345678" };
const booking = { serviceId:"test-service",date,time:"10:00",petName:"Prueba",species:"DOG",size:"SMALL",coat:"LONG",accepted:true,customer };
before(async()=>{
  await db.slot.deleteMany();
  await db.appointment.deleteMany();
  await db.orderItem.deleteMany();
  await db.order.deleteMany();
  await db.pet.deleteMany();
  await db.customer.deleteMany();
  await db.resource.deleteMany();
  await db.service.deleteMany();
  await db.product.deleteMany();
  await db.service.create({data:{id:"test-service",name:"Test grooming",kind:"GROOMING",description:"Test",price:25000,duration:90}});
  await db.resource.create({data:{id:"test-resource",name:"Test resource",kind:"GROOMING"}});
  await db.product.create({data:{id:"test-product",name:"Test product",description:"Test",category:"FOOD",pet:"DOG",detail:"Test",price:5000,stock:3,image:"/images/food.webp"}});
});
after(async()=>{await db.$disconnect();rmSync(temp,{recursive:true,force:true});});
test("reserva persiste y bloquea todos los intervalos de su duración",async()=>{
  const result=await createBooking(booking);
  assert.equal(result.status,"PENDING");
  assert.equal(result.price,25000);
  assert.equal(await db.slot.count({where:{appointmentId:result.id}}),3);
  const times=await availableTimes("test-service",date,"SMALL");
  assert.ok(!times.includes("10:00"));
  assert.ok(!times.includes("10:30"));
  await assert.rejects(createBooking({...booking,time:"10:30"}),/ocupar/);
});
test("reserva repetida no crea registros huérfanos",async()=>{
  await assert.rejects(createBooking(booking),/ocupar/);
  assert.equal(await db.appointment.count(),1);
  assert.equal(await db.pet.count(),1);
});
test("agenda respeta cierre, pausa, anticipación y zona de Santiago",()=>{
  assert.ok(!scheduleTimes(date,90).includes("12:00"));
  assert.ok(!scheduleTimes(date,90).includes("17:00"));
  assert.equal(scheduleTimes("2020-01-01",30).length,0);
  assert.equal(new Intl.DateTimeFormat("en-GB",{timeZone:"America/Santiago",hour:"2-digit",minute:"2-digit",hour12:false}).format(startAt(date,"10:00")),"10:00");
});
test("pedido usa precios del servidor y descuenta stock una sola vez",async()=>{
  const input={customer,accepted:true,idempotencyKey:randomUUID(),items:[{productId:"test-product",quantity:2,price:1}]};
  const order=await createOrder(input);
  assert.equal(order.total,10000);
  const retry=await createOrder(input);
  assert.equal(retry.id,order.id);
  assert.equal((await db.product.findUniqueOrThrow({where:{id:"test-product"}})).stock,1);
});
test("pedido sin stock se revierte sin venta ni descuento parcial",async()=>{
  const count=await db.order.count();
  await assert.rejects(createOrder({customer,accepted:true,idempotencyKey:randomUUID(),items:[{productId:"test-product",quantity:2}]}),/stock/);
  assert.equal(await db.order.count(),count);
  assert.equal((await db.product.findUniqueOrThrow({where:{id:"test-product"}})).stock,1);
});
test("validación rechaza reserva sin consentimiento y datos inválidos",async()=>{
  await assert.rejects(createBooking({...booking,accepted:false}));
  await assert.rejects(createBooking({...booking,customer:{...customer,phone:"123"}}));
});
