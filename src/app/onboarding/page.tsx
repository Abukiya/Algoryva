import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { completeOnboarding } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { AuthFrame } from "@/components/auth/AuthFrame";

export const metadata: Metadata = { title: "Get started", robots: { index: false } };
export const dynamic = "force-dynamic";

const EXP = [["beginner", "Complete beginner", "Start from the very first lesson."], ["some", "Some programming experience", "You have written code, but not competitively."], ["comfortable", "Comfortable programmer", "Skip the Foundation level."], ["competitive", "Already doing competitive programming", "Skip Foundation, Beginner and Core."]];
const LANG = [["python", "Python"], ["cpp", "C++"], ["java", "Java"], ["js", "JavaScript"]];

export default async function Onboarding() {
  const user = await requireUser();
  if (user.onboarded) redirect("/dashboard");
  return (
    <AuthFrame title={`Welcome, ${user.username}`} lead="Two questions, then your roadmap opens. Skipped levels are marked as known, and you can still open any lesson.">
      <form action={completeOnboarding} className="space-y-8">
        <fieldset><legend className="mb-2 font-extrabold">Your programming experience</legend>
          <div className="space-y-2">{EXP.map(([v, l, d], i) => (
            <label key={v} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong bg-surface p-3.5 transition hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/[.06] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20">
              <input type="radio" name="experience" value={v} defaultChecked={i === 0} className="mt-1 h-4 w-4 accent-[rgb(var(--brand))]" /><span><span className="block font-bold">{l}</span><span className="text-sm text-soft">{d}</span></span></label>))}</div></fieldset>
        <fieldset><legend className="mb-2 font-extrabold">Preferred language</legend>
          <div className="grid grid-cols-2 gap-2">{LANG.map(([v, l], i) => (
            <label key={v} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-surface p-3 font-bold transition hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand/[.06] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/20">
              <input type="radio" name="language" value={v} defaultChecked={i === 0} className="h-4 w-4 accent-[rgb(var(--brand))]" />{l}</label>))}</div>
          <p className="hint">Lessons are Python-first for now; this is saved for when more languages are added.</p></fieldset>
        <SubmitButton className="btn btn-primary btn-lg w-full" pendingLabel="Building your roadmap">Continue</SubmitButton>
      </form>
    </AuthFrame>
  );
}
