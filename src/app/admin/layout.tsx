import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/shell/AdminNav";

// Every admin route inherits this guard in addition to its own requireAdmin() call.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="page-wide">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line pb-4">
        <Link href="/admin" className="text-lg font-extrabold">Admin</Link>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
