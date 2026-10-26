export const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value);
export const statusLabel: Record<string, string> = {
  PENDING: "Pendiente", CONFIRMED: "Confirmada", ARRIVED: "Llegó", IN_PROGRESS: "En atención",
  COMPLETED: "Completada", CANCELLED: "Cancelada", NO_SHOW: "No asistió",
  PREPARING: "Preparando", READY: "Listo para retiro", FULFILLED: "Entregado",
};
export const kindLabel = (kind: string) => kind === "GROOMING" ? "Peluquería" : "Veterinaria";
