import { PrismaClient } from "@prisma/client";
import { TOPICS } from "../src/lib/curriculum";
import { EXTERNAL_PROBLEMS } from "../src/content/externalProblems";
import { ORIGINAL_PROBLEMS } from "../src/content/originalProblems";
import { HIDDEN_TESTS } from "../src/content/hiddenTests";
import { normalizeProblemUrl, slugify } from "../src/lib/url";
const db = new PrismaClient();

async function main() {
  for (const [i, t] of TOPICS.entries()) {
    await db.topic.upsert({
      where: { slug: t.slug },
      update: { title: t.title, level: t.level, status: t.status, position: i },
      create: { slug: t.slug, title: t.title, level: t.level, status: t.status, position: i },
    });
  }
  const ids = new Map((await db.topic.findMany({ select: { id: true, slug: true } })).map((t) => [t.slug, t.id]));
  for (const t of TOPICS) {
    for (const p of t.prereqs) {
      const topicId = ids.get(t.slug)!, prerequisiteId = ids.get(p)!;
      await db.topicPrerequisite.upsert({
        where: { topicId_prerequisiteId: { topicId, prerequisiteId } },
        update: {}, create: { topicId, prerequisiteId },
      });
    }
  }
  console.log(`Seeded ${TOPICS.length} topics`);

  const seenUrls = new Set<string>();
  for (const [i, e] of EXTERNAL_PROBLEMS.entries()) {
    const n = normalizeProblemUrl(e.url);
    if (!n.ok) throw new Error(`${e.title}: ${n.error}`);
    if (seenUrls.has(n.url)) throw new Error(`Duplicate external link: ${n.url}`);
    seenUrls.add(n.url);
    const topicId = ids.get(e.topic);
    if (!topicId) throw new Error(`Unknown topic ${e.topic}`);
    const data = { title: e.title, kind: "EXTERNAL" as const, difficulty: e.difficulty, status: "PUBLISHED" as const, source: n.platform, externalUrl: n.url, normalizedUrl: n.url, position: i };
    const p = await db.problem.upsert({ where: { normalizedUrl: n.url }, update: data, create: { ...data, slug: slugify(`${n.platform}-${e.title}`) } });
    await db.problemTopic.upsert({ where: { problemId_topicId: { problemId: p.id, topicId } }, update: {}, create: { problemId: p.id, topicId } });
  }
  for (const [i, o] of ORIGINAL_PROBLEMS.entries()) {
    const topicId = ids.get(o.topic);
    if (!topicId) throw new Error(`Unknown topic ${o.topic}`);
    const data = { title: o.title, kind: "INTERNAL" as const, difficulty: o.difficulty, status: "PUBLISHED" as const, statement: o.statement, inputSpec: o.inputSpec, outputSpec: o.outputSpec, constraints: o.constraints, timeLimitMs: 1000, memoryLimitMb: 256, position: 1000 + i };
    const p = await db.problem.upsert({ where: { slug: o.slug }, update: data, create: { ...data, slug: o.slug } });
    await db.problemTopic.upsert({ where: { problemId_topicId: { problemId: p.id, topicId } }, update: {}, create: { problemId: p.id, topicId } });
    await db.testCase.deleteMany({ where: { problemId: p.id, isSample: true } });
    await db.testCase.deleteMany({ where: { problemId: p.id, isSample: false } });
    await db.testCase.createMany({ data: (HIDDEN_TESTS[o.slug] ?? []).map((h) => ({ problemId: p.id, input: h.input, expected: h.expected, isSample: false })) });
    await db.testCase.createMany({ data: o.samples.map((sm) => ({ problemId: p.id, input: sm.input, expected: sm.output, explanation: sm.explanation ?? null, isSample: true })) });
  }
  console.log(`Seeded ${EXTERNAL_PROBLEMS.length} external and ${ORIGINAL_PROBLEMS.length} original problems`);
}
main().finally(() => db.$disconnect());
