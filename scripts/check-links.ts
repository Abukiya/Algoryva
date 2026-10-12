// Usage: npx tsx scripts/check-links.ts
// Requests every published external problem URL and reports non-OK responses.
// LeetCode/HackerRank may answer 403/429 to scripts even for valid links: treat those as "unknown", not "broken".
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const rows = await db.problem.findMany({ where: { kind: "EXTERNAL" }, select: { title: true, externalUrl: true } });
  let bad = 0;
  for (const r of rows) {
    if (!r.externalUrl) continue;
    try {
      const res = await fetch(r.externalUrl, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 link-check" }, signal: AbortSignal.timeout(15000) });
      if (res.status === 404 || res.status === 410) { bad++; console.log(`BROKEN ${res.status}  ${r.title}  ${r.externalUrl}`); }
      else if (!res.ok) console.log(`UNKNOWN ${res.status}  ${r.title}  ${r.externalUrl}`);
    } catch (e) { console.log(`ERROR  ${r.title}  ${r.externalUrl}  ${(e as Error).message}`); }
    await sleep(700);
  }
  console.log(`Checked ${rows.length} links, ${bad} broken (404/410).`);
}
main().finally(() => db.$disconnect());
