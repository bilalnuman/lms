// period.ts
export type Period = {
    startLabel: string;   // e.g. "AUG-2025"
    endLabel: string;     // e.g. "DEC-2026"
    yearRange: string;    // e.g. "2025-2026"
    startDate: Date;      // first day of start period
    endDate: Date;        // last day of end period
    months: string[];     // ["AUG-2025", ..., "DEC-2026"]
};

const MONTHS_3 = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

/** "MMM-YYYY" e.g. "AUG-2025" */
export function formatMMMYYYY(d: Date): string {
    return `${MONTHS_3[d.getMonth()]}-${d.getFullYear()}`;
}

/** Last day of month (monthIdx: 0..11) */
function lastDayOfMonth(year: number, monthIdx: number) {
    return new Date(year, monthIdx + 1, 0);
}

/**
 * Build a period from:
 *  - start = first of current month (default), or January of current year if alignToJanuary = true
 *  - end   = last day of December of next year
 *
 * Examples:
 *  base = 2025-08-31, alignToJanuary=false → AUG-2025 .. DEC-2026
 *  base = 2026-01-05, alignToJanuary=true  → JAN-2026 .. DEC-2027
 */
export function buildPeriod(opts?: { base?: Date; alignToJanuary?: boolean }): Period {
    const base = opts?.base ?? new Date();
    const alignToJanuary = !!opts?.alignToJanuary;

    const startDate = alignToJanuary
        ? new Date(base.getFullYear(), 0, 1) // Jan 1 of current year
        : new Date(base.getFullYear(), base.getMonth(), 1); // first of current month

    const endDate = lastDayOfMonth(base.getFullYear() + 1, 11); // Dec of next year

    // Build month labels inclusive
    const months: string[] = [];
    for (let y = startDate.getFullYear(), m = startDate.getMonth();
        y < endDate.getFullYear() || (y === endDate.getFullYear() && m <= endDate.getMonth());
        m = (m + 1) % 12, y += m === 0 ? 1 : 0) {
        months.push(`${MONTHS_3[m]}-${y}`);
    }

    return {
        startLabel: formatMMMYYYY(startDate),
        endLabel: formatMMMYYYY(endDate),
        yearRange: `${startDate.getFullYear()}-${endDate.getFullYear()}`,
        startDate,
        endDate,
        months,
    };
}

/**
 * Roll an existing period when the **new year** arrives.
 * If now's year equals the period's end year (e.g., prev end is DEC-2026 and now is in 2026),
 * rebuild aligned to January → JAN-YYYY .. DEC-(YYYY+1).
 */
export function rollPeriodIfNewYear(prev: Period, now: Date = new Date()): Period {
    const endYear = parseInt(prev.endLabel.slice(-4), 10);
    if (now.getFullYear() === endYear) {
        return buildPeriod({ base: now, alignToJanuary: true });
    }
    return prev;
}
