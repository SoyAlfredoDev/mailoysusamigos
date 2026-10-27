import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PawPrint, UsersRound } from "lucide-react";
import Link from "next/link";
import { CustomerAdminCreate, CustomerAdminAccount } from "@/components/customer-admin";
export default async function Page() {
  await requireAdmin();
  const [customers, pets] = await Promise.all([
    db.customer.findMany({ include: { guardianships: { include: { pet: true } }, authUser: { select: { id: true, active: true, emailVerified: true } }, _count: { select: { appointments: true, orders: true } } }, orderBy: { name: "asc" }, take: 100 }),
    db.pet.findMany({ include: { guardians: { include: { customer: { select: { id: true, name: true, lastName: true } } } } }, orderBy: { name: "asc" }, take: 200 }),
  ]);
  return <><div className="admin-page-heading"><div><div className="eyebrow">PARTE DE NUESTRA FAMILIA</div><h1>Clientes y mascotas</h1><p>Cuentas, contactos y mascotas con tutores compartidos.</p></div></div>
    <CustomerAdminCreate contacts={customers.map(({ id, name, lastName, email }) => ({ id, name, lastName, email }))}/>
    <h2 className="account-list-title">Personas</h2><div className="customer-grid">{customers.map(c => <article key={c.id} className="admin-card customer-card"><div className="customer-title"><span className="avatar">{c.name.charAt(0)}</span><div><h2>{c.name} {c.lastName}</h2><p>{c.email}</p></div></div><p className="customer-phone">{c.phone}</p><span className="account-status">{!c.authUser ? "Contacto sin cuenta de acceso" : !c.authUser.active ? "Acceso deshabilitado" : c.authUser.emailVerified ? "Cuenta verificada" : "Correo por confirmar"}</span><div className="customer-pets">{c.guardianships.map(({ pet: p }) => <span key={p.id}><PawPrint size={13}/>{p.name} <small>{p.code}</small></span>)}</div><div className="customer-counts"><span>{c._count.appointments} citas</span><span>{c._count.orders} pedidos</span></div>{c.authUser && <CustomerAdminAccount id={c.authUser.id} active={c.authUser.active}/>}</article>)}</div>
    {!customers.length && <div className="empty-state"><UsersRound size={35}/><h2>Pronto conoceremos nuevos amigos.</h2></div>}
    <h2 className="account-list-title">Mascotas</h2><div className="customer-grid">{pets.map(p => <article className="admin-card customer-card" key={p.id}><div className="customer-title"><span className="avatar"><PawPrint size={21}/></span><div><h2>{p.name}</h2><p>{p.species === "CAT" ? "Gato" : "Perro"} · <strong>{p.code}</strong></p></div></div><p className="field-hint">Tutores: {p.guardians.map(g => g.customer.name + " " + g.customer.lastName).join(", ")}</p><Link className="text-link" href={"/compartir-mascota/" + p.code} target="_blank">Enlace para que un tutor invite</Link><p className="field-hint">Comparte este enlace con un tutor asociado. Debe ingresar con su propia cuenta.</p></article>)}</div>
  </>;
}
