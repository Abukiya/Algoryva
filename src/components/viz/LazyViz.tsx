"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { Viz } from "@/lib/viz/steps";

const VizPlayer = dynamic(() => import("./VizPlayer"), { ssr: false, loading: () => <div className="skeleton my-6 h-72 rounded-card" aria-hidden="true" /> });

/** Loads the player code and renders the stage only once the visualization scrolls near the viewport. */
export function LazyViz({ viz }: { viz: Viz }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || show) return;
    if (typeof IntersectionObserver === "undefined") { setShow(true); return; }
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); } }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [show]);
  return <div ref={ref} style={{ minHeight: show ? undefined : 288 }}>{show ? <VizPlayer viz={viz} /> : <div className="skeleton my-6 h-72 rounded-card" aria-hidden="true" />}</div>;
}
