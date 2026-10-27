import { CustomerAuthForm } from "@/components/customer-auth-form";
export const metadata = { title: "Elige tu contraseña", referrer: "no-referrer" as const };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  return <CustomerAuthForm mode="reset" token={(await searchParams).token}/>;
}
