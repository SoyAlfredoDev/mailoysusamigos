"use client";
import { useState } from "react";
import { customerAuthClient } from "@/lib/customer-auth-client";
export function CustomerSignOut() {
  const [pending, setPending] = useState(false), [error, setError] = useState("");
  return <><button className="button outline" disabled={pending} onClick={async () => {
    setPending(true); setError("");
    try { const result = await customerAuthClient.signOut(); if (result.error) throw new Error(); location.assign("/ingresar"); }
    catch { setError("No pudimos cerrar la sesión. Intenta nuevamente."); setPending(false); }
  }}>{pending ? "Cerrando…" : "Cerrar sesión"}</button>{error && <p role="alert">{error}</p>}</>;
}
