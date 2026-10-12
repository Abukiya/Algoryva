"use client";
import { Callout } from "@/components/ui";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page max-w-xl space-y-4">
      <Callout tone="bad" title="Something went wrong loading this page">Your progress is safe. Try again, and if it keeps happening, come back in a minute.</Callout>
      <button onClick={reset} className="btn btn-primary">Try again</button>
    </div>
  );
}
