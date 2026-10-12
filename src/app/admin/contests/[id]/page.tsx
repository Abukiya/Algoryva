import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ContestForm, type Values } from "../ContestForm";
export const metadata: Metadata = { title: "Admin: edit contest", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function EditContest({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const problems = await db.problem.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true }, take: 500 });
  let initial: Values = { title: "", description: "", durationMin: 90, status: "DRAFT", problemIds: [] };
  if (id !== "new") {
    const c = await db.contest.findUnique({ where: { id }, include: { problems: { orderBy: { position: "asc" } } } });
    if (!c) notFound();
    initial = { id: c.id, title: c.title, description: c.description, durationMin: c.durationMin, status: c.status, problemIds: c.problems.map((p) => p.problemId) };
  }
  return (<div><h1 className="mb-6 text-3xl font-extrabold">{id === "new" ? "New contest" : "Edit contest"}</h1><ContestForm initial={initial} problems={problems} /></div>);
}
