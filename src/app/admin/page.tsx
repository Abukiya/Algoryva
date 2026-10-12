import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PageHeader, Stat } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

const AREAS: { href: string; title: string; body: string; icon: IconName }[] = [
  { href: "/admin/problems", title: "Problems", body: "Create, edit, publish and reorder original and external problems.", icon: "code" },
  { href: "/admin/lessons", title: "Lessons", body: "Override built-in lesson text with your own, per topic.", icon: "book" },
  { href: "/admin/contests", title: "Contests", body: "Assemble contests from published problems.", icon: "trophy" },
  { href: "/admin/users", title: "Users", body: "Search accounts, change roles, suspend abuse.", icon: "users" },
  { href: "/admin/analytics", title: "Analytics", body: "Activity, popular topics and problems, mistake mix.", icon: "chart" },
];

export default async function AdminPage() {
  const admin = await requireAdmin(); // server-side check on every request
  const [users, topics, problems, drafts] = await Promise.all([db.user.count(), db.topic.count(), db.problem.count({ where: { status: "PUBLISHED" } }), db.problem.count({ where: { status: "DRAFT" } })]);
  return (
    <>
      <PageHeader title="Overview" lead={`Signed in as ${admin.username}.`} />
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4"><Stat label="Users" value={users} icon="users" /><Stat label="Topics" value={topics} icon="route" /><Stat label="Published problems" value={problems} icon="code" /><Stat label="Draft problems" value={drafts} icon="edit" hint={drafts ? <Link className="font-bold text-brand" href="/admin/problems?status=DRAFT">Review drafts</Link> : undefined} /></dl>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{AREAS.map((a) => <li key={a.href}><Link href={a.href} className="card card-link flex h-full gap-4 p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={a.icon} size={20} /></span><span><span className="block font-extrabold">{a.title}</span><span className="text-sm text-soft">{a.body}</span></span></Link></li>)}</ul>
    </>
  );
}
