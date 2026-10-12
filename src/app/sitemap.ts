import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { TOPICS } from "@/lib/curriculum";

export const dynamic = "force-dynamic"; // reads the DB; avoids needing a database at build time

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  const problems = await db.problem.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } });
  return [
    ...["", "/learn", "/roadmap", "/problems", "/visualizer"].map((p) => ({ url: `${base}${p}` })),
    ...TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => ({ url: `${base}/learn/${t.slug}` })),
    ...problems.map((p) => ({ url: `${base}/problems/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
