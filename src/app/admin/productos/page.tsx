import Image from "next/image";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { updateProduct } from "../actions";
import { AdminForm } from "@/components/admin-form";
export default async function Page() {
  await requireAdmin();
  const products=await db.product.findMany({orderBy:{name:"asc"}});
  return <><div className="admin-page-heading"><div><div className="eyebrow">SUS FAVORITOS, SIEMPRE A MANO</div><h1>Productos e inventario</h1><p>Actualiza los productos del catálogo y su disponibilidad.</p></div></div><div className="admin-products">{products.map(p=><article className="admin-card admin-product" key={p.id}><div className="admin-product-heading"><Image src={p.image} width={85} height={85} alt=""/><div><h2>{p.name}</h2><p>{p.detail} · {money(p.price)}</p><span className={p.stock<=3?"badge pending":"badge"}>{p.stock} en stock</span></div></div><details><summary>Editar producto</summary><AdminForm action={updateProduct}><input name="id" type="hidden" value={p.id}/><label className="field">Nombre<input name="name" required minLength={2} maxLength={100} defaultValue={p.name}/></label><label className="field">Descripción<textarea name="description" required minLength={2} maxLength={1000} defaultValue={p.description} rows={3}/></label><div className="form-two-columns"><label className="field">Precio CLP<input type="number" name="price" required min={100} max={10000000} defaultValue={p.price}/></label><label className="field">Stock<input type="number" name="stock" required min={0} max={100000} defaultValue={p.stock}/></label></div><label className="checkbox-field"><input type="checkbox" name="active" defaultChecked={p.active}/> Visible en la tienda</label></AdminForm></details></article>)}</div></>;
}
