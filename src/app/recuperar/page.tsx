import { CustomerAuthForm } from "@/components/customer-auth-form";
export const metadata = { title: "Recupera tu acceso", referrer: "no-referrer" as const };
export default function Page() { return <CustomerAuthForm mode="forgot"/>; }
