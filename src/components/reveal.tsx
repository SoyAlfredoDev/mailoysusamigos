"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
export function Reveal({ children, className = "", delay = 0, direction = "up" }: { children: ReactNode; className?: string; delay?: number; direction?: "up" | "left" | "right" }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: direction === "up" ? 22 : 0, x: direction === "left" ? -22 : direction === "right" ? 22 : 0 }} whileInView={{ opacity: 1, y: 0, x: 0 }} viewport={{ once: true, amount: .12, margin: "0px 0px -18px 0px" }} transition={{ duration: .6, delay, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}
