import type { Column } from "@/components/datatable";
export function withColumnOverrides<T>(
  cols: Column<T>[],
  overrides: Partial<Record<string, Partial<Column<T>>>>
): Column<T>[] {
  return cols.map((c) => {
    const key = String(c.key);
    return overrides[key] ? { ...c, ...overrides[key] } : c;
  });
}
