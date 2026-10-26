import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
export const metadata = { title: "Administración" };
export const dynamic = "force-dynamic";
export default async function Layout({ children }: { children: React.ReactNode }) { await requireAdmin(); return <AdminShell>{children}</AdminShell>; }
