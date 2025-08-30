import { ReactNode, useMemo } from "react";
import { Column } from "./datatable";
import TableActions from "./TableActions";

export function ListView<T extends Record<string, any>>({
    items,
    columns,
    children
}: {
    items: T[];
    columns: Column<T>[];
    children?: ReactNode
}) {
    const fieldColumns = useMemo(
        () => columns.filter((c) => String(c.key) !== "actions"),
        [columns]
    );

    if (items.length === 0) {
        return (
            <div className="py-10 text-center text-lg font-medium text-slate-500">
                No results
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {items.map((row, idx) => (
                <div
                    key={String((row as any).id ?? idx)}
                    className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                    {/* Header */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs uppercase text-slate-400">Roll #</div>
                            <div className="text-base font-semibold text-slate-800">
                                {String((row as any).roll ?? "—")}
                            </div>
                        </div>
                        <TableActions row={row} onPress={(r, act) => console.log(act, r)} />
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 gap-2">
                        {fieldColumns.map((col) => {
                            const raw = (row as any)[col.key];
                            const value = col.render ? col.render(raw, row) : (raw ?? "—");
                            return (
                                <div key={String(col.key)} className="flex items-start gap-2">
                                    <div className="w-36 shrink-0 text-xs font-medium uppercase tracking-wide text-slate-500">
                                        {col.label}
                                    </div>
                                    <div className="min-w-0 break-words text-sm text-slate-800">
                                        {value as any}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
            {children}
        </div>
    );
}