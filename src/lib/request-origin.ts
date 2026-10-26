export function hasSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return ["https:", "http:"].includes(parsed.protocol) && parsed.host === host;
  } catch { return false; }
}
