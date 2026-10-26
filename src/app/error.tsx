"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="container page-section empty-state"><h1>Necesitamos un momento.</h1><p>No pudimos cargar esta página. Intenta nuevamente.</p><button className="button dark" onClick={reset}>Volver a intentar</button></div>; }
