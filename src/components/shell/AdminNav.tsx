"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [["Overview", "/admin"], ["Problems", "/admin/problems"], ["Lessons", "/admin/lessons"], ["Contests", "/admin/contests"], ["Users", "/admin/users"], ["Analytics", "/admin/analytics"]] as const;
export function AdminNav() {
  const p = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-1 max-w-full overflow-x-auto px-1"><div className="tabs">
      {ITEMS.map(([l, h]) => <Link key={h} href={h} className="tab" aria-current={(h === "/admin" ? p === h : p.startsWith(h)) ? "page" : undefined}>{l}</Link>)}
    </div></nav>
  );
}
