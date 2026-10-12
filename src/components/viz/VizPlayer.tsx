"use client";
import type { Viz } from "@/lib/viz/steps";
import { Stepper } from "./Stepper";
import { ArrayStage } from "./ArrayStage";
import { GraphStage } from "./GraphStage";
import { GridStage } from "./GridStage";

export default function VizPlayer({ viz }: { viz: Viz }) {
  if (viz.kind === "array") return <Stepper title={viz.title} count={viz.frames.length} caption={(i) => viz.frames[i].note}>{(i) => <ArrayStage f={viz.frames[i]} />}</Stepper>;
  if (viz.kind === "graph") return <Stepper title={viz.title} count={viz.frames.length} caption={(i) => viz.frames[i].note}>{(i) => <GraphStage f={viz.frames[i]} />}</Stepper>;
  return <Stepper title={viz.title} count={viz.frames.length} caption={(i) => viz.frames[i].note}>{(i) => <GridStage f={viz.frames[i]} />}</Stepper>;
}
