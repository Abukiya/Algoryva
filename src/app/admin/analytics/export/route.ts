import { requireAdmin } from "@/lib/auth/session";
import { loadFunnel } from "@/lib/funnel-data";
import { funnelCsv } from "@/lib/funnel";

export const dynamic = "force-dynamic";

/** Admin-only CSV of the lesson funnel. requireAdmin redirects anyone else before any data is read. */
export async function GET() {
  await requireAdmin();
  const rows = await loadFunnel();
  return new Response(funnelCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="lesson-funnel.csv"', "Cache-Control": "no-store" },
  });
}
