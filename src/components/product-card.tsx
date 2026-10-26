"use client";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { useCart } from "./cart-provider";
import { money } from "@/lib/format";
export type ProductView = { id: string; name: string; detail: string; image: string; price: number; stock: number; category: string; pet: string; description?: string };
export function ProductCard({ product }: { product: ProductView }) {
  const { add, items, ready } = useCart();
  const quantity = items.find(i => i.id === product.id)?.quantity || 0;
  return <article className="product-card"><Link className="product-image" href={"/tienda/" + product.id}><Image src={product.image} alt={product.name + " · imagen ilustrativa"} width={600} height={600} sizes="(max-width: 599px) 45vw, (max-width: 899px) 44vw, 280px"/><span className="product-view"><ArrowUpRight size={18}/></span>{product.stock <= 3 && product.stock > 0 && <span className="stock-chip">Últimas unidades</span>}</Link><div className="product-info"><p className="product-detail">{product.detail}</p><Link href={"/tienda/" + product.id}><h3>{product.name}</h3></Link><div className="product-price-row"><strong>{money(product.price)}</strong><motion.button whileTap={{scale:.9}} className="product-add" aria-label={"Agregar " + product.name} onClick={() => add(product)} disabled={!ready || product.stock === 0 || quantity >= Math.min(product.stock, 20)}><AnimatePresence initial={false} mode="wait"><motion.span key={quantity ? "added" : "add"} initial={{opacity:0,rotate:-35,scale:.7}} animate={{opacity:1,rotate:0,scale:1}} exit={{opacity:0,scale:.7}} transition={{duration:.14}}>{quantity ? <Check size={18}/> : <Plus size={19}/>}</motion.span></AnimatePresence></motion.button></div>{product.stock === 0 && <p className="out-of-stock">Agotado</p>}</div></article>;
}
