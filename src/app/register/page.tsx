import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { register } from "@/app/actions";
export const metadata: Metadata = { title: "Register" };
export default function RegisterPage() {
  return (
    <AuthFrame current="register" title="Create your account" lead="Free. It takes a minute, then we tailor the roadmap to you."
      footer={<p>Already have an account? <Link className="font-bold text-brand" href="/login">Log in</Link></p>}>
      <AuthForm action={register} register submitLabel="Create account" />
    </AuthFrame>
  );
}
