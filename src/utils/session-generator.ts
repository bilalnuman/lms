export type SessionOption = { value: string; label: string };
export function sessions(opts?: {
  before?: number;         // years before anchor year (default 10)
  after?: number;          // years after anchor year  (default 2)
  blockYears?: number;     // session length (default 4)
  rolloverMonth?: number;  // month (1-12) when NEW academic year starts (default 1 = Jan)
  now?: Date;              // for testing
}): SessionOption[] {
  const before = opts?.before ?? 10;
  const after = opts?.after ?? 2;
  const blockYears = opts?.blockYears ?? 4;
  const rolloverMonth = Math.min(12, Math.max(1, opts?.rolloverMonth ?? 1));
  const now = opts?.now ?? new Date();

  // Determine the anchor (academic) year.
  // If your academic year starts in July (7), then Jan–Jun are still the previous academic year.
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1..12
  const anchorYear = currentMonth < rolloverMonth ? currentYear - 1 : currentYear;

  // Compute sliding range
  const start = anchorYear - before;
  const lastStart = (anchorYear + after) - blockYears;

  const out: SessionOption[] = [];
  if (lastStart >= start) {
    for (let s = start; s <= lastStart; s += 1) {
      const e = s + blockYears;
      const label = `${s}-${e}`;
      out.push({ value: label, label });
    }
  }
  return out;
}

// Typo-friendly alias exactly as you requested:
export const sesstions = sessions;
