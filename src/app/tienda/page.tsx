import { Shop } from "@/components/shop";
import { db } from "@/lib/db";
import { PawPrint } from "lucide-react";
export const metadata = { title: "Petshop" };
export const dynamic = "force-dynamic";
export default async function Store() {
  const products = await db.product.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return <div className="container page-section"><div className="shop-heading"><div><div className="eyebrow">EL PETSHOP DE MILO</div><h1>Pequeños gustos.<br/><span>Grandes colitas felices.</span></h1><p>Encuentra sus esenciales y su próximo juguete favorito.</p></div><div className="shop-heading-mark"><PawPrint size={68}/><span>Para perros<br/>y gatos.</span></div></div><div className="demo-note">Versión de demostración · Catálogo, imágenes y valores referenciales. Los pedidos se registran sin cobro.</div><Shop products={products}/></div>;
}
