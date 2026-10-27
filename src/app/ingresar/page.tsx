import { CustomerAuthForm } from "@/components/customer-auth-form";
export const metadata = { title: "Ingresa a tu cuenta", referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ continuar?: string }> }) {
  return <CustomerAuthForm mode="login" returnTo={(await searchParams).continuar}/>;
}
