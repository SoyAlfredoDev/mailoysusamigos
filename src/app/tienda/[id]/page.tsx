import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ProductDetail } from "@/components/product-detail";
export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findFirst({ where: { id, active: true } });
  if (!product) notFound();
  return <div className="container page-section"><Link href="/tienda" className="back-link"><ArrowLeft size={17}/> Volver a la tienda</Link><ProductDetail product={product}/></div>;
}
