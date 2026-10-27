export const TIMEZONE = "America/Santiago";
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export function addDays(date: string, count: number) {
  const value = new Date(date + "T12:00:00Z");
  value.setUTCDate(value.getUTCDate() + count);
  return value.toISOString().slice(0, 10);
}
export function startAt(date: string, time: string) {
  const offset = new Intl.DateTimeFormat("en", { timeZone: TIMEZONE, timeZoneName: "longOffset" })
    .formatToParts(new Date(date + "T12:00:00Z")).find(p => p.type === "timeZoneName")!.value.replace("GMT", "") || "+00:00";
  return new Date(date + "T" + time + ":00" + offset);
}
export function dateLabel(date: string, short = false) {
  return new Intl.DateTimeFormat("es-CL", { timeZone: TIMEZONE, weekday: short ? "short" : "long", day: "numeric", month: short ? "short" : "long" }).format(new Date(date + "T12:00:00Z"));
}
export function serviceQuote(service: { price: number; duration: number; kind: string }, size?: string) {
  const multiplier = service.kind === "GROOMING" ? ({ SMALL: 1, MEDIUM: 1.2, LARGE: 1.5, GIANT: 1.8 }[size || "SMALL"] || 1) : 1;
  return { price: Math.round(service.price * multiplier), duration: service.kind === "VET" ? 30 : service.duration + (service.kind === "GROOMING" && (size === "LARGE" || size === "GIANT") ? 30 : 0) };
}
export function isValidDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date + "T12:00:00Z")) && new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
}
export function isWalkInDate(date: string, kind: string) {
  return kind === "VET" && isValidDate(date) && new Date(date + "T12:00:00Z").getUTCDay() === 6;
}
export function scheduleTimes(date: string, duration: number, kind = "VET") {
  if (!isValidDate(date) || date < today() || date > addDays(today(), 30)) return [];
  const weekday = new Date(date + "T12:00:00Z").getUTCDay();
  if (!weekday || isWalkInDate(date, kind)) return [];
  const vet = kind === "VET";
  if (vet && duration !== 30) return [];
  const close = weekday === 6 ? 17 * 60 : 18 * 60;
  const unavailableStart = vet ? 14 * 60 : 13 * 60;
  const unavailableEnd = vet ? 15 * 60 : 14 * 60;
  const times: string[] = [];
  for (let minute = vet ? 540 : 600; minute + duration <= close; minute += 30) {
    if (minute < unavailableEnd && minute + duration > unavailableStart) continue;
    const time = String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
    if (startAt(date, time).getTime() > Date.now() + 60 * 60 * 1000) times.push(time);
  }
  return times;
}
export function slotStarts(start: Date, duration: number) {
  return Array.from({ length: duration / 30 }, (_, i) => new Date(start.getTime() + i * 30 * 60000));
}
