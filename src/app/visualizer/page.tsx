import type { Metadata } from "next";
import { VisualizerApp } from "@/components/visualizer/VisualizerApp";
import { ALGORITHMS, algosForLesson, getAlgorithm } from "@/lib/visualizer/registry";

export const metadata: Metadata = {
  title: "Algorithm visualizer",
  description: "Step through searching, sorting, stack, queue and tree algorithms with your own input, the pseudocode, and the complexity.",
};

type Props = { searchParams: Promise<{ algo?: string; lesson?: string }> };

export default async function VisualizerPage({ searchParams }: Props) {
  const sp = await searchParams;
  const byAlgo = sp.algo ? getAlgorithm(sp.algo) : undefined;
  const fromLesson = sp.lesson ? algosForLesson(sp.lesson)[0] : undefined;
  const initial = byAlgo ?? fromLesson ?? ALGORITHMS[0];
  return <VisualizerApp initialId={initial.id} />;
}
