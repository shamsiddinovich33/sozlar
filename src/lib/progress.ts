/** Share of mastered cards as a whole percentage (0–100). */
export function masteryPercent(mastered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((mastered / total) * 100)));
}
