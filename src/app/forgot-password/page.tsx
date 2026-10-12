import type { Metadata } from "next";
import Link from "next/link";
import { SimpleForm } from "@/components/SimpleForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { requestPasswordReset } from "@/app/auth-actions";
export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };
export default function Page() {
  return (
    <AuthFrame title="Reset your password" lead="Enter your email and we will send a reset link if an account exists." footer={<Link className="font-bold text-brand" href="/login">Back to log in</Link>}>
      <SimpleForm action={requestPasswordReset} fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]} submitLabel="Send reset link" />
    </AuthFrame>
  );
}
