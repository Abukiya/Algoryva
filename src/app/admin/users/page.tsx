import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { setRole, setSuspended } from "./actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Admin: users", robots: { index: false } };
export const dynamic = "force-dynamic";
const SIZE = 50;

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100), page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const where = q ? { OR: [{ username: { contains: q, mode: "insensitive" as const } }, { email: { contains: q, mode: "insensitive" as const } }] } : {};
  const [users, total] = await Promise.all([
    db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * SIZE, take: SIZE, select: { id: true, username: true, email: true, role: true, suspended: true, createdAt: true } }),
    db.user.count({ where }),
  ]);
  return (
    <>
      <PageHeader title={`Users (${total})`} />
      <form role="search" className="mb-4 flex max-w-md gap-2"><span className="relative flex-1"><Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} aria-label="Search users" placeholder="Username or email" className="input pl-9" /></span><button className="btn btn-secondary">Search</button></form>
      {users.length === 0 ? <EmptyState icon="users" title="No users match">Try part of a username or email.</EmptyState> : (
        <div className="card overflow-x-auto"><table className="table-clean min-w-[44rem]"><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th className="text-right"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{users.map((u) => (
            <tr key={u.id}><td className="font-bold">{u.username}</td><td className="text-soft">{u.email}</td><td><span className={`chip ${u.role === "ADMIN" ? "chip-brand" : ""}`}>{u.role === "ADMIN" ? "Admin" : "User"}</span></td><td><span className={`chip ${u.suspended ? "chip-bad" : "chip-ok"}`}>{u.suspended ? "Suspended" : "Active"}</span></td>
              <td><div className="flex justify-end gap-1.5">{u.id === admin.id ? <span className="text-xs font-semibold text-muted">You</span> : <>
                <form action={setRole}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="role" value={u.role === "ADMIN" ? "USER" : "ADMIN"} /><SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Saving">{u.role === "ADMIN" ? "Make user" : "Make admin"}</SubmitButton></form>
                <form action={setSuspended}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="suspend" value={u.suspended ? "0" : "1"} /><SubmitButton className={`btn btn-sm ${u.suspended ? "btn-secondary" : "btn-danger"}`} pendingLabel="Saving">{u.suspended ? "Unsuspend" : "Suspend"}</SubmitButton></form></>}</div></td></tr>))}</tbody></table></div>)}
      <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">{page > 1 ? <Link className="btn btn-secondary btn-sm" href={`?q=${encodeURIComponent(q)}&page=${page - 1}`}>Previous</Link> : <span />}{page * SIZE < total ? <Link className="btn btn-secondary btn-sm" href={`?q=${encodeURIComponent(q)}&page=${page + 1}`}>Next</Link> : <span />}</nav>
    </>
  );
}
