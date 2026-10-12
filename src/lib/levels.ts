import type { Level } from "@/lib/curriculum";

/** Presentation metadata for the six curriculum levels. `n` picks the --lvN colour token. */
export const LEVEL_META: Record<Level, { label: string; n: 1 | 2 | 3 | 4 | 5 | 6; blurb: string }> = {
  FOUNDATION: { label: "Foundation", n: 1, blurb: "The Python and complexity toolkit everything else leans on." },
  BEGINNER: { label: "Beginner", n: 2, blurb: "Arrays and sorting: your first real algorithms." },
  CORE: { label: "Core", n: 3, blurb: "The patterns behind most easy and medium problems." },
  INTERMEDIATE: { label: "Intermediate", n: 4, blurb: "Data structures, graphs and your first dynamic programming." },
  ADVANCED: { label: "Advanced", n: 5, blurb: "Specialised structures and harder techniques." },
  EXPERT: { label: "Expert", n: 6, blurb: "Contest strategy and pattern recognition." },
};

export const levelColor = (level: Level) => `rgb(var(--lv${LEVEL_META[level].n}))`;
export const levelText = (level: Level) => `text-lv${LEVEL_META[level].n}`;
