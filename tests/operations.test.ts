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
const { createBooking, createOrder, availableTimes, rescheduleBooking, setBookingStatus } = await import("../src/lib/operations");
const { today, addDays, scheduleTimes, startAt } = await import("../src/lib/schedule");
let date = addDays(today(),2);
if (new Date(date+"T12:00:00Z").getUTCDay()===0) date=addDays(date,1);
const customer = { name:"Prueba automatizada",email:"automated@example.test",phone:"+56912345678" };
const booking = { idempotencyKey:randomUUID(), serviceId:"test-service",date,time:"10:00",petName:"Prueba",species:"DOG",size:"SMALL",coat:"LONG",accepted:true,customer };
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
  assert.equal(result.status,"CONFIRMED");
  assert.equal(result.price,25000);
  assert.equal(await db.slot.count({where:{appointmentId:result.id}}),3);
  const times=await availableTimes("test-service",date,"SMALL");
  assert.ok(!times.includes("10:00"));
  assert.ok(!times.includes("10:30"));
  await assert.rejects(createBooking({...booking,idempotencyKey:randomUUID(),time:"10:30"}),/ocupar/);
});
test("reintento idempotente no crea citas, mascotas ni avisos duplicados",async()=>{
  const existing=await createBooking(booking);
  assert.equal(existing.idempotencyKey,booking.idempotencyKey);
  assert.equal(await db.appointmentNotice.count(),2);
  assert.equal(await db.appointment.count(),1);
  assert.equal(await db.pet.count(),1);
});
test("agenda respeta cierre, pausa, anticipación y zona de Santiago",()=>{
  assert.ok(!scheduleTimes(date,90,"GROOMING").includes("12:00"));
  assert.ok(!scheduleTimes(date,90,"GROOMING").includes("17:00"));
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

test("veterinaria ofrece solo lunes a viernes, 30 minutos y respeta límites",async()=>{
  const {serviceQuote, isValidDate} = await import('../src/lib/schedule');
  assert.equal(serviceQuote({price:15000,duration:90,kind:'VET'}).duration,30);
  const times=scheduleTimes(date,30,'VET');
  assert.equal(times[0],'09:00'); assert.equal(times.at(-1),'17:30');
  assert.ok(times.includes('13:30')); assert.ok(times.includes('15:00'));
  assert.ok(!times.includes('14:00')); assert.ok(!times.includes('14:30'));
  assert.equal(times.length,16);
  let saturday=date;while(new Date(saturday+'T12:00Z').getUTCDay()!==6) saturday=addDays(saturday,1);
  assert.deepEqual(scheduleTimes(saturday,30,'VET'),[]);
  assert.deepEqual(scheduleTimes(addDays(saturday,1),30,'VET'),[]);
  assert.equal(isValidDate('2026-02-30'),false);
});
test("áreas independientes, un solo cupo por área incluso con varios recursos",async()=>{
  await db.service.create({data:{id:'test-vet',name:'Consulta',kind:'VET',description:'Consulta',price:15000,duration:90}});
  await db.resource.create({data:{id:'test-vet-resource',name:'Veterinaria',kind:'VET'}});
  await db.resource.create({data:{id:'test-second-groom',name:'Otro equipo',kind:'GROOMING'}});
  const vet=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',petName:'Nala'});
  assert.equal((vet.endAt.getTime()-vet.startAt.getTime())/60000,30);
  assert.equal(vet.status,'CONFIRMED');
  await assert.rejects(createBooking({...booking,idempotencyKey:randomUUID()}),/ocupar/);
  assert.ok(!(await availableTimes('test-vet',date)).includes('10:00'));
  assert.ok((await availableTimes('test-vet',date)).includes('10:30'));
  await assert.rejects(createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'14:00'}),/horario/);
});
test("contacto invitado conserva datos del perfil y usa sus propios datos de reserva",async()=>{
  const result=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'11:00',customer:{...customer,name:'Nombre en la reserva',phone:'+56987654321'}});
  assert.equal((await db.customer.findUniqueOrThrow({where:{id:result.customerId}})).name,customer.name);
  assert.equal(result.contactName,'Nombre en la reserva'); assert.equal(result.contactPhone,'+56987654321');
  await assert.rejects(createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'11:30',petId:result.petId}),/Inicia sesión/);
});
test("reprogramar y cancelar actualizan cupos y sustituyen avisos pendientes",async()=>{
  const a=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'12:00'});
  await rescheduleBooking(a.id,date,'12:30');
  assert.ok((await availableTimes('test-vet',date)).includes('12:00'));
  assert.ok(!(await availableTimes('test-vet',date)).includes('12:30'));
  await assert.rejects(rescheduleBooking(a.id,date,'14:00'),/Horario/);
  await setBookingStatus(a.id,'CANCELLED');
  assert.ok((await availableTimes('test-vet',date)).includes('12:30'));
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:a.id,status:'PENDING'}}),2);
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:a.id,status:'CANCELLED'}}),4);
  await assert.rejects(setBookingStatus(a.id,'CONFIRMED'),/finalizada/);
});
test("avisos durables envían ambos destinatarios, reintentan y no duplican envíos",async()=>{
  const {deliverBookingNotices}=await import('../src/lib/booking-notifications');
  const a=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'15:00'});
  const received:{to:string;idempotencyKey?:string}[]=[];
  await deliverBookingNotices(db,async mail=>{received.push(mail);return {id:'provider-'+received.length};},a.id);
  assert.equal(received.length,2);assert.ok(received.some(m=>m.to===customer.email));
  assert.ok(received.some(m=>m.to==='contacto@mailoysusamigos.cl'));
  await deliverBookingNotices(db,async()=>{throw Error('must not resend');},a.id);
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:a.id,status:'SENT'}}),2);
  const b=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'15:30'});
  await deliverBookingNotices(db,async()=>{throw Object.assign(Error('temporary'),{retryable:true});},b.id);
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:b.id,status:'PENDING',attempts:1}}),2);
  await db.appointmentNotice.updateMany({where:{appointmentId:b.id},data:{nextAttemptAt:new Date(0)}});
  await deliverBookingNotices(db,async()=>({id:'retry-success'}),b.id);
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:b.id,status:'SENT'}}),2);
});

test("cliente autenticado reutiliza su mascota; un extraño no puede reservarla",async()=>{
  const user=await db.user.create({data:{name:'Tutor',lastName:'Verificado',email:'verified-booking@example.test',phone:'+56911223344',emailVerified:true}});
  const contact=await db.customer.create({data:{name:user.name,lastName:user.lastName,email:user.email,phone:user.phone,authUserId:user.id}});
  const pet=await db.pet.create({data:{name:'Mascota guardada',species:'CAT',code:'M-TEST88',customerId:contact.id,guardians:{create:{customerId:contact.id}}}});
  const count=await db.pet.count();
  const a=await createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'09:00',petId:pet.id}, {userId:user.id});
  assert.equal(a.petId,pet.id);assert.equal(a.customerId,contact.id);
  assert.equal(a.contactEmail,user.email);assert.equal(await db.pet.count(),count);
  const stranger=await db.user.create({data:{name:'Otra',lastName:'Persona',email:'stranger-booking@example.test',phone:'+56911223344',emailVerified:true}});
  await assert.rejects(createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'09:30',petId:pet.id},{userId:stranger.id}),/permiso/);
  assert.ok((await availableTimes('test-vet',date)).includes('09:30'));
});
test("dos solicitudes concurrentes no reservan el mismo cupo",async()=>{
  const results=await Promise.allSettled([1,2].map(()=>createBooking({...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'17:00'})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(await db.appointment.count({where:{serviceId:'test-vet',date,time:'17:00'}}),1);
});
test("dos reintentos concurrentes de la misma solicitud devuelven una sola cita",async()=>{
  const input={...booking,idempotencyKey:randomUUID(),serviceId:'test-vet',time:'17:30'};
  const [a,b]=await Promise.all([createBooking(input),createBooking(input)]);
  assert.equal(a.id,b.id);
  assert.equal(await db.appointmentNotice.count({where:{appointmentId:a.id}}),2);
});
