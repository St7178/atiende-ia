import type { Metadata } from "next";
import SignInPage from "@/components/ui/travel-connect-signin-1";
import { googleEnabled } from "@/lib/google-auth";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Ingresar - ${brand.name}`,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;
  return <SignInPage from={from} error={error} googleEnabled={googleEnabled()} />;
}
