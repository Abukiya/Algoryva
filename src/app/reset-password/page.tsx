import type { Metadata } from "next";
import { SimpleForm } from "@/components/SimpleForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { resetPassword } from "@/app/auth-actions";
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token ?? "";
  return (
    <AuthFrame title="Choose a new password" lead="Pick something you have not used elsewhere.">
      <SimpleForm action={resetPassword} fields={[{ name: "token", label: "", hidden: token }, { name: "password", label: "New password (10+ characters)", type: "password", autoComplete: "new-password" }]} submitLabel="Set password" />
    </AuthFrame>
  );
}
