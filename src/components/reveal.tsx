"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export function Reveal({ children, className = "", delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: "up" | "left" | "right" }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { y: direction === "up" ? 14 : 0, x: direction === "left" ? -14 : direction === "right" ? 14 : 0 }} whileInView={{ y: 0, x: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .55, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}
