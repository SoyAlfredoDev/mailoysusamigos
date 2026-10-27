"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

/** Photography remains untouched. The optional canvas only paints ambient light. */
export function HeroScene({ children }: { children: ReactNode }) {
  const scene = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const host = scene.current;
    const surface = canvas.current;
    if (!host || !surface || paused) return;
    const media = matchMedia("(min-width: 900px) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let cleanup: (() => void) | undefined;
    let disposed = false;
    let generation = 0;
    async function sync() {
      const version = ++generation;
      cleanup?.();
      cleanup = undefined;
      if (!media.matches) return;
      const { createAmbientLight } = await import("@/lib/ambient-light");
      if (!disposed && version === generation) cleanup = createAmbientLight(surface!, host!);
    }
    void sync();
    media.addEventListener("change", sync);
    return () => { disposed = true; generation++; cleanup?.(); media.removeEventListener("change", sync); };
  }, [paused]);

  return <div ref={scene} className="hero-scene" data-paused={paused}>
    <div className="hero-atmosphere" aria-hidden="true"><canvas ref={canvas}/><span className="ambient-orbit orbit-one"/><span className="ambient-orbit orbit-two"/></div>
    {children}
    <button className="ambient-toggle" onClick={() => setPaused(p => !p)} aria-pressed={paused} aria-label={paused ? "Activar ambiente animado" : "Pausar ambiente animado"}>{paused ? <Play size={13}/> : <Pause size={13}/>}<span>{paused ? "Activar ambiente" : "Pausar ambiente"}</span></button>
    <div className="hero-wave" aria-hidden="true"><svg viewBox="0 0 1440 100" preserveAspectRatio="none"><path d="M0 50C270 140 420 -30 720 40S1160 120 1440 20V100H0Z"/></svg></div>
  </div>;
}
