import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TOPICS } from "@/lib/curriculum";
import { ProblemForm, type FormValues } from "../ProblemForm";

export const metadata: Metadata = { title: "Admin: edit problem", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditProblem({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  let initial: FormValues = { kind: "EXTERNAL", title: "", difficulty: "EASY", status: "DRAFT", position: 0, topics: [], externalUrl: "", statement: "", inputSpec: "", outputSpec: "", constraints: "", sampleInput: "", sampleOutput: "" };
  if (id !== "new") {
    const p = await db.problem.findUnique({ where: { id }, include: { topics: { select: { topic: { select: { slug: true } } } }, testCases: { where: { isSample: true }, take: 1 } } });
    if (!p) notFound();
    initial = { id: p.id, kind: p.kind, title: p.title, difficulty: p.difficulty, status: p.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT", position: p.position, topics: p.topics.map((t) => t.topic.slug),
      externalUrl: p.externalUrl ?? "", statement: p.statement ?? "", inputSpec: p.inputSpec ?? "", outputSpec: p.outputSpec ?? "", constraints: p.constraints ?? "", sampleInput: p.testCases[0]?.input ?? "", sampleOutput: p.testCases[0]?.expected ?? "" };
  }
  return (<div><h1 className="mb-6 text-3xl font-extrabold">{id === "new" ? "New problem" : "Edit problem"}</h1>
    <ProblemForm initial={initial} topics={TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => ({ slug: t.slug, title: t.title }))} /></div>);
}
