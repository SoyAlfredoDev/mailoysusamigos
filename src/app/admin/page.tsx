import Link from "next/link";
import { AlertTriangle, ArrowUpRight, CalendarDays, Plus, ShoppingBag } from "lucide-react";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { addDays, dateLabel, TIMEZONE, today } from "@/lib/schedule";
import { money, statusLabel } from "@/lib/format";
import { Agenda } from "@/components/agenda";
export default async function Page({ searchParams }: { searchParams: Promise<{ fecha?: string; vista?: string }> }) {
  await requireAdmin();
  const query = await searchParams;
  const date = query.fecha && /^\d{4}-\d{2}-\d{2}$/.test(query.fecha) && Number.isFinite(Date.parse(query.fecha)) ? query.fecha : today();
  const view = query.vista === "semana" ? "semana" : "dia";
  const [appointments, resources, orders, lowStock, todayCount, pendingOrders] = await Promise.all([
    db.appointment.findMany({ where: { date: view === "semana" ? { gte: date, lte: addDays(date,6) } : date }, include: { service:true,resource:true,pet:true,customer:true }, orderBy:[{date:"asc"},{time:"asc"}] }),
    db.resource.findMany({ orderBy:{id:"asc"} }),
    db.order.findMany({ where:{status:{notIn:["FULFILLED","CANCELLED"]}}, include:{customer:true,items:true},orderBy:{createdAt:"desc"},take:3 }),
    db.product.findMany({where:{stock:{lte:3},active:true},take:4}),
    db.appointment.count({where:{date:today(),status:{notIn:["CANCELLED","NO_SHOW"]}}}),
    db.order.count({where:{status:{notIn:["FULFILLED","CANCELLED"]}}}),
  ]);
  const formatted=appointments.map(a=>({id:a.id,reference:a.reference,date:a.date,time:a.time,endTime:new Intl.DateTimeFormat("es-CL",{timeZone:TIMEZONE,hour:"2-digit",minute:"2-digit",hour12:false}).format(a.endAt),duration:Math.round((a.endAt.getTime()-a.startAt.getTime())/60000),status:a.status,price:a.price,notes:a.notes,resourceId:a.resourceId,kind:a.service.kind,service:a.service.name,pet:a.pet.name,species:a.pet.species,size:a.pet.size,customer:a.customer.name,phone:a.customer.phone,email:a.customer.email}));
  return <><div className="admin-page-heading"><div><div className="eyebrow">CUIDARLOS EMPIEZA POR ORGANIZARNOS</div><h1>{view==="semana"?"Agenda de la semana":"Agenda del día"}</h1><p>{dateLabel(date)}</p></div><Link href="/agendar" className="button dark"><Plus size={17}/> Nueva cita</Link></div><div className="admin-stats"><div><span className="stat-icon"><CalendarDays size={21}/></span><div><p>Citas de hoy</p><strong>{todayCount}</strong></div><small>Hoy</small></div><div><span className="stat-icon peach"><ShoppingBag size={21}/></span><div><p>Pedidos pendientes</p><strong>{pendingOrders}</strong></div><Link href="/admin/pedidos" aria-label="Ver pedidos"><ArrowUpRight size={17}/></Link></div><div><span className="stat-icon red"><AlertTriangle size={21}/></span><div><p>Stock bajo</p><strong>{lowStock.length}</strong></div><Link href="/admin/productos" aria-label="Ver productos con stock bajo"><ArrowUpRight size={17}/></Link></div></div><Agenda appointments={formatted} resources={resources.map(r=>({id:r.id,name:r.name,kind:r.kind}))} date={date} view={view}/><div className="admin-summary-grid"><section className="admin-card"><div className="admin-card-heading"><h2><ShoppingBag size={17}/> Pedidos por preparar</h2><Link href="/admin/pedidos">Ver todos <ArrowUpRight size={13}/></Link></div>{orders.length?<div className="table-scroll"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Estado</th><th/></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>{o.reference}</td><td>{o.customer.name}</td><td>{money(o.total)}</td><td><span className={"badge "+o.status}>{statusLabel[o.status]}</span></td><td><Link className="text-link" href="/admin/pedidos">Ver</Link></td></tr>)}</tbody></table></div>:<p className="admin-empty">Todo al día. Los nuevos pedidos aparecerán aquí.</p>}</section><section className="admin-card"><div className="admin-card-heading"><h2><AlertTriangle size={17}/> Atención al stock</h2><Link href="/admin/productos">Revisar <ArrowUpRight size={13}/></Link></div>{lowStock.length?<ul className="stock-alert-list">{lowStock.map(p=><li key={p.id}><span>{p.name}</span><strong>{p.stock} un.</strong></li>)}</ul>:<p className="admin-empty">El inventario está en orden.</p>}</section></div><p className="demo-caption">Operación de demostración · Los datos enviados desde la web aparecen en este panel.</p></>;
}
