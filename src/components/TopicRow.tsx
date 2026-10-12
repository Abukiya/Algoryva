import Link from "next/link";
import type { TopicDef } from "@/lib/curriculum";
import { Icon } from "@/components/Icon";

/** Compact list row kept for simple lists; the roadmap and learn pages use richer TopicCard. */
export function TopicRow({ topic }: { topic: TopicDef }) {
  const soon = topic.status === "COMING_SOON";
  return (
    <li className="flex items-center justify-between border-b border-line py-2">
      {soon ? <span className="text-muted">{topic.title}</span> : <Link href={`/learn/${topic.slug}`} className="hover:text-brand">{topic.title}</Link>}
      {soon ? <span className="chip">Coming soon</span> : <Icon name="chevronRight" size={16} className="text-muted" />}
    </li>
  );
}
