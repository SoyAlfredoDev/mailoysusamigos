"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { z } from "zod";
const storedSchema = z.array(z.object({ id: z.string(), name: z.string(), detail: z.string(), price: z.number().nonnegative(), image: z.string(), stock: z.number().int().nonnegative(), quantity: z.number().int().min(1).max(20) })).max(30);
export type CartItem = z.infer<typeof storedSchema>[number];
type CartContext = { items: CartItem[]; ready: boolean; add: (p: Omit<CartItem, "quantity">) => void; update: (id: string, q: number) => void; clear: () => void; count: number; total: number; notice: string };
const Context = createContext<CartContext | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try { const value = storedSchema.safeParse(JSON.parse(localStorage.getItem("milo-cart-v1") || "[]")); if (value.success) setItems(value.data); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) { try { localStorage.setItem("milo-cart-v1", JSON.stringify(items)); } catch {} } }, [items, ready]);
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(""), 2500); return () => clearTimeout(t); }, [notice]);
  function add(product: Omit<CartItem, "quantity">) {
    if (!ready || !product.stock) return;
    setItems(current => {
      const existing = current.find(p => p.id === product.id);
      if (existing && existing.quantity >= Math.min(20, product.stock)) return current;
      return existing ? current.map(p => p.id === product.id ? { ...p, ...product, quantity: p.quantity + 1 } : p) : [...current, { ...product, quantity: 1 }];
    });
    setNotice(product.name + " · agregado al carrito");
  }
  function update(id: string, quantity: number) { setItems(current => quantity <= 0 ? current.filter(p => p.id !== id) : current.map(p => p.id === id ? { ...p, quantity: Math.min(quantity, p.stock, 20) } : p)); }
  return <Context.Provider value={{ items, ready, add, update, clear: () => setItems([]), count: items.reduce((s, p) => s + p.quantity, 0), total: items.reduce((s, p) => s + p.price * p.quantity, 0), notice }}>{children}<div role="status" aria-live="polite" className={notice ? "toast show" : "toast"}>{notice}</div></Context.Provider>;
}
export function useCart() { const context = useContext(Context); if (!context) throw new Error("CartProvider is missing"); return context; }
