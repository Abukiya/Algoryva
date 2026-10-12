export type Row = { name: string; solved: number; penaltyMin: number };

/** Penalty = total minutes from the entry's start to each solve (rounded down). */
export function scoreEntry(startedAt: Date, solves: { solvedAt: Date }[]): { solved: number; penaltyMin: number } {
  return { solved: solves.length, penaltyMin: solves.reduce((t, s) => t + Math.max(0, Math.floor((s.solvedAt.getTime() - startedAt.getTime()) / 60_000)), 0) };
}

export const rank = (rows: Row[]) => [...rows].sort((a, b) => b.solved - a.solved || a.penaltyMin - b.penaltyMin || a.name.localeCompare(b.name));
export const endsAt = (startedAt: Date, durationMin: number) => new Date(startedAt.getTime() + durationMin * 60_000);
export const isRunning = (startedAt: Date, durationMin: number, now = new Date()) => now < endsAt(startedAt, durationMin);
