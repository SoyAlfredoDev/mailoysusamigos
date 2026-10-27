import { CustomerAuthForm } from "@/components/customer-auth-form";
export const metadata = { title: "Crea tu cuenta", referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ continuar?: string }> }) {
  return <CustomerAuthForm mode="register" returnTo={(await searchParams).continuar}/>;
}
