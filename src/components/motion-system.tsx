"use client";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export const softEase = [0.22, 1, 0.36, 1] as const;

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: .3, ease: softEase }}>{children}</MotionConfig>;
}

export function PageEntrance({ children }: { children: ReactNode }) {
  const path = usePathname();
  const reduced = useReducedMotion();
  return <motion.div key={path} className="page-entrance" initial={reduced ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32, ease: softEase }}>{children}</motion.div>;
}
