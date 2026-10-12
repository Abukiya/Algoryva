import Link from "next/link";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return <div className="page max-w-xl"><EmptyState icon="search" title="This page does not exist" action={<Link href="/learn" className="btn btn-primary">Browse the curriculum</Link>}>The link may be old, or the lesson or problem was unpublished.</EmptyState></div>;
}
