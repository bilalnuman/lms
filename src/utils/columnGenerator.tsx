// columnGenerator.tsx
import { Column, Direction } from "@/hooks/useDataTable";
import * as React from "react";


type GenConfig<T extends Record<string, any>> = {
    /** Put these keys first (and in this order). Others follow after. */
    order?: (keyof T | string)[];
    /** Keys to skip entirely. */
    exclude?: (keyof T | string)[];
    /** Replace default labels per key. */
    labels?: Record<string, string>;
    /** px max-width for ellipsis on certain columns. */
    truncates?: Record<string, number>;
    /** Render these keys as <strong>value</strong>. */
    strong?: (keyof T | string)[];
    /** Default sortable (per-column `sortable` can be overridden via `custom`). */
    defaultSortable?: boolean;
    /** Sort icon provider (your getSortIcon). */
    getSortIcon?: (direction: Direction) => React.ReactNode;
    /**
     * Per-key column overrides: render, sortable, etc.
     * e.g. custom: { email: { render: (v)=> <a href={`mailto:${v}`}>{v}</a> } }
     */
    custom?: Partial<Record<string, Partial<Column<T>>>>;
    /**
     * Inject an Actions column at the end.
     * If `key` matches a real field (like "id") your DataTable will still pass its value.
     */
    actions?: {
        key?: string;           // default "id"
        label?: string;         // default "Actions"
        render: (row: T) => React.ReactNode;
        sortable?: boolean;     // default false
    };
};

/** "className" -> "Class Name", "sessionName" -> "Session Name" */
function titleCaseLabel(key: string) {
    return key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^\w/, (c) => c.toUpperCase());
}

/** Build a truncating renderer (ellipsis, single line) */
function makeTruncateRenderer(px: number) {
    return (value: string) => (
        <div
            style={{
                maxWidth: px,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            }}
            title={typeof value === "string" ? value : ""}
        >
            {value}
        </div>
    );
}

/** Strong renderer */
function makeStrongRenderer() {
    return (value: React.ReactNode) => <strong>{value}</strong>;
}

/**
 * Infer columns from data shape (first row), with complete control via config.
 */
export function buildColumnsFromData<T extends Record<string, any>>(
    data: T[],
    cfg: GenConfig<T> = {}
): Column<T>[] {
    const {
        order = [],
        exclude = [],
        labels = {},
        truncates = {},
        strong = [],
        defaultSortable = true,
        getSortIcon,
        custom = {},
        actions,
    } = cfg;

    // 1) Figure out the keys we have
    const sample = data?.[0] ?? {};
    const allKeys = Object.keys(sample);

    // 2) Filter & order
    const excludeSet = new Set(exclude.map(String));
    const orderList = order.map(String);

    const remaining = allKeys.filter((k) => !excludeSet.has(k));
    const ordered: string[] = [
        ...orderList.filter((k) => remaining.includes(k)),
        ...remaining.filter((k) => !orderList.includes(k)),
    ];

    // 3) Build base columns
    const cols: Column<T>[] = ordered.map((key) => {
        const label =
            labels[key] ??
            // Common nicer labels if not provided
            ({
                roll: "Roll #",
                from: "Form #",
                batch: "Batch #",
                className: "Class Name",
                sessionName: "Session Name",
                mobile: "Mobile #",
                email: "Email",
                status: "Status",
            } as Record<string, string>)[key] ??
            titleCaseLabel(key);

        const base: Column<T> = {
            key,
            label,
            sortable: defaultSortable,
            getSortIcon,
        };

        // default renderers by key (you can tweak here)
        let render: Column<T>["render"] | undefined;

        if (key in truncates) {
            render = makeTruncateRenderer(truncates[key]);
        }

        if (strong.map(String).includes(key)) {
            const prev = render;
            const s = makeStrongRenderer();
            render = (v, row) => s(prev ? prev(v, row) : v);
        }

        // Nice defaults for certain fields if user didn't override
        if (key === "email" && !custom[key]?.render) {
            render = (v: string) =>
                v ? (
                    <a href={`mailto:${v}`} style={{ color: "#2563eb" }}>
                        {v}
                    </a>
                ) : (
                    ""
                );
        }
        if (key === "mobile" && !custom[key]?.render) {
            render = (v: string) =>
                v ? (
                    <a href={`tel:${v}`} style={{ color: "#2563eb" }}>
                        {v}
                    </a>
                ) : (
                    ""
                );
        }

        // Apply user overrides (last wins)
        const merged: Column<T> = { ...base, ...custom[key] };
        if (render && !custom[key]?.render) merged.render = render;

        return merged;
    });

    // 4) Optional actions column at the end
    if (actions?.render) {
        const key = actions.key ?? "id";
        cols.push({
            key,
            label: actions.label ?? "Actions",
            sortable: actions.sortable ?? false,
            render: (_value: any, row: T) => actions.render(row),
        });
    }

    return cols;
}
