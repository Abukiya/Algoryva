const dayNum = (d: Date) => Math.floor(d.getTime() / 86_400_000); // UTC days

/** A streak stays alive through the current UTC day: it only breaks once a whole day passes with no activity. */
export function computeStreak(dates: Date[], now: Date = new Date()) {
  const days = [...new Set(dates.map(dayNum))].sort((a, b) => a - b);
  let longest = 0, run = 0;
  days.forEach((d, i) => { run = i > 0 && d === days[i - 1] + 1 ? run + 1 : 1; longest = Math.max(longest, run); });
  const set = new Set(days), today = dayNum(now);
  let cur: number | null = set.has(today) ? today : set.has(today - 1) ? today - 1 : null;
  let current = 0;
  while (cur !== null && set.has(cur)) { current++; cur--; }
  return { current, longest };
}
