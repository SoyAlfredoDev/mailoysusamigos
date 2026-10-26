import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PawPrint, UsersRound } from "lucide-react";
export default async function Page() {
  await requireAdmin();
  const customers=await db.customer.findMany({include:{pets:true,_count:{select:{appointments:true,orders:true}}},orderBy:{name:"asc"},take:100});
  return <><div className="admin-page-heading"><div><div className="eyebrow">PARTE DE NUESTRA FAMILIA</div><h1>Clientes y mascotas</h1><p>Contactos y amigos vinculados a las solicitudes.</p></div></div><div className="customer-grid">{customers.map(c=><article key={c.id} className="admin-card customer-card"><div className="customer-title"><span className="avatar">{c.name.charAt(0)}</span><div><h2>{c.name}</h2><p>{c.email}</p></div></div><p className="customer-phone">{c.phone}</p><div className="customer-pets">{c.pets.map(p=><span key={p.id}><PawPrint size={13}/>{p.name} <small>{p.species==="CAT"?"Gato":"Perro"}</small></span>)}</div><div className="customer-counts"><span>{c._count.appointments} citas</span><span>{c._count.orders} pedidos</span></div></article>)}</div>{!customers.length&&<div className="empty-state"><UsersRound size={35}/><h2>Pronto conoceremos nuevos amigos.</h2></div>}</>;
}
