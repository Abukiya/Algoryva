import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { consumeToken } from "@/lib/auth/tokens";
import { AuthFrame } from "@/components/auth/AuthFrame";
import { Icon } from "@/components/Icon";
export const metadata: Metadata = { title: "Verify email", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const userId = await consumeToken((await searchParams).token ?? "", "verify");
  if (userId) await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return (
    <AuthFrame title={userId ? "Email verified" : "Link invalid or expired"} lead={userId ? "Thanks, your email address is confirmed." : "Request a new verification email from your dashboard."}>
      <span className={`mb-6 grid h-14 w-14 place-items-center rounded-full ${userId ? "animate-pop bg-ok text-white" : "bg-bad/10 text-bad"}`}><Icon name={userId ? "check" : "alert"} size={26} strokeWidth={2.4} /></span>
      <Link href="/dashboard" className="btn btn-primary btn-lg w-full">Go to dashboard<Icon name="arrowRight" size={18} /></Link>
    </AuthFrame>
  );
}
