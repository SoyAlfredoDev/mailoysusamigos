"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, ShoppingBag } from "lucide-react";
import type { ProductView } from "./product-card";
import { useCart } from "./cart-provider";
import { money } from "@/lib/format";
export function ProductDetail({ product }: { product: ProductView }) {
  const { add, items, ready } = useCart();
  const quantity = items.find(p => p.id === product.id)?.quantity || 0;
  return <div className="product-detail-grid"><div className="detail-photo"><Image src={product.image} alt={product.name + " · fotografía ilustrativa"} width={900} height={900} priority/></div><div className="detail-copy"><div className="eyebrow">SELECCIÓN MILO</div><h1>{product.name}</h1><p className="muted">{product.detail}</p><div className="detail-price">{money(product.price)}</div><p>{product.description}</p><div className="stock-line"><span className={product.stock ? "stock-dot" : "stock-dot empty"}/>{product.stock ? "Disponible · " + product.stock + " unidades" : "Agotado"}</div><button className="button dark full" disabled={!ready || !product.stock || quantity >= Math.min(20, product.stock)} onClick={() => add(product)}><ShoppingBag size={18}/>{quantity ? "Agregar otra unidad (" + quantity + " en el carrito)" : "Agregar al carrito"}</button>{quantity > 0 && <Link href="/carrito" className="button outline full">Ver mi carrito <ArrowRight size={17}/></Link>}<div className="detail-benefits"><p><Check size={16}/> Solicita tu pedido sin crear una cuenta.</p><p><Check size={16}/> Modalidad de retiro en local.</p></div><p className="demo-caption">Producto, precio y fotografía de ejemplo. Esta versión no realiza cobros.</p></div></div>;
}
