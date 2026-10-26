"use client";
import { useDeferredValue, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Cat, Dog, Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard, type ProductView } from "./product-card";
const categories = [{ id: "ALL", label: "Todo para ellos" }, { id: "FOOD", label: "Alimentos" }, { id: "HYGIENE", label: "Higiene" }, { id: "ACCESSORIES", label: "Accesorios" }];
export function Shop({ products }: { products: ProductView[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [pet, setPet] = useState("ALL");
  const [sort, setSort] = useState("recommended");
  const deferredQuery = useDeferredValue(query);
  const filtered = products.filter(p => (category === "ALL" || p.category === category) && (pet === "ALL" || p.pet === "BOTH" || p.pet === pet) && (p.name + " " + p.detail).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(deferredQuery.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()));
  if (sort === "low") filtered.sort((a,b) => a.price - b.price);
  if (sort === "high") filtered.sort((a,b) => b.price - a.price);
  return <><div className="shop-controls"><div className="search-field"><Search size={20}/><input type="search" placeholder="¿Qué necesita tu mascota?" aria-label="Buscar productos" value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={16}/></button>}</div><div className="pet-filters"><button aria-pressed={pet === "ALL"} className={pet === "ALL" ? "selected" : ""} onClick={() => setPet("ALL")}>Todos</button><button aria-pressed={pet === "DOG"} className={pet === "DOG" ? "selected" : ""} onClick={() => setPet("DOG")}><Dog size={18}/> Perros</button><button aria-pressed={pet === "CAT"} className={pet === "CAT" ? "selected" : ""} onClick={() => setPet("CAT")}><Cat size={18}/> Gatos</button></div></div><div className="shop-toolbar"><div className="category-filters">{categories.map(c => <button key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} className={category === c.id ? "selected" : ""}>{c.label}</button>)}</div><label className="sort-control"><SlidersHorizontal size={16}/><span className="sr-only">Ordenar productos</span><select value={sort} onChange={e => setSort(e.target.value)}><option value="recommended">Recomendados</option><option value="low">Menor precio</option><option value="high">Mayor precio</option></select></label></div><p className="results-count" aria-live="polite">{filtered.length} {filtered.length === 1 ? "producto" : "productos"} para hacerle feliz</p>{filtered.length ? <motion.div layout className="product-grid shop-grid" style={{position:"relative"}}><AnimatePresence initial={false} mode="popLayout">{filtered.map(p => <motion.div layout="position" key={p.id} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:.96}} transition={{duration:.24}}><ProductCard product={p}/></motion.div>)}</AnimatePresence></motion.div> : <div className="empty-state"><Search size={35}/><h2>No encontramos ese favorito.</h2><p>Prueba con otra palabra o cambia los filtros.</p><button className="button dark" onClick={() => { setQuery(""); setCategory("ALL"); setPet("ALL"); }}>Ver todos los productos</button></div>}</>;
}
