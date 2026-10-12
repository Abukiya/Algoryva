import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { login } from "@/app/actions";
export const metadata: Metadata = { title: "Log in" };
export default function LoginPage() {
  return (
    <AuthFrame current="login" title="Welcome back" lead="Pick up where you left off."
      footer={<p>New here? <Link className="font-bold text-brand" href="/register">Create an account</Link>. <Link className="font-bold text-brand" href="/forgot-password">Forgot your password?</Link></p>}>
      <AuthForm action={login} submitLabel="Log in" />
    </AuthFrame>
  );
}
