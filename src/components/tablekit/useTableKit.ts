"use client";
import * as React from "react";
import { Column } from "../datatable";
import { SelectOption } from "../widgets/Select";

export type Option = { label: string; value: string | number };

export type FilterDefs<T, FK extends string> = {
    options: Record<FK, Option[]>;
    field: Record<FK, keyof T | ((row: T) => string | number | undefined | null)>;
};

export type TableKitOptions<T, FK extends string> = {
    data: T[];
    columns: Column<T>[];
    filters?: FilterDefs<T, FK>;
    initialFilters?: Partial<Record<FK, SelectOption | null>>;
    searchKeys?: (keyof T | string)[];
    storageKey?: string;
    pinnedKeys?: (keyof T | string)[];
    initialLayout?: "table" | "list";
    pageSize?: number;
};

export type Direction = "asc" | "desc";

export type TableKitReturn<T, FK extends string> = {
    query: string;
    setQuery: React.Dispatch<React.SetStateAction<string>>;
    deferredQuery: string;

    filters: Record<FK, Option | null>;
    setFilter: (key: FK, opt: Option | null) => void;
    resetAll: () => void;

    selectedRows: (string | number)[];
    setSelectedRows: React.Dispatch<React.SetStateAction<(string | number)[]>>;
    onSelectionChange: (sel: Set<string | number>) => void;

    layout: "table" | "list";
    toggleLayout: () => void;

    hiddenKeys: string[];
    visibleColumns: Column<T>[];
    toggleableKeys: string[];
    visibleKeysForPicker: string[];
    toggleColumn: (key: string, checked: boolean) => void;
    resetColumns: () => void;

    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    pageSize: number;
    totalPages: number;

    rows: T[];
    pagedRows: T[];
};

export function useTableKit<T, FK extends string = never>(
    opts: TableKitOptions<T, FK>
): TableKitReturn<T, FK> {
    const {
        data,
        columns,
        filters: filterDefs,
        initialFilters,
        searchKeys = [],
        storageKey = "tablekit:hiddenColumns",
        pinnedKeys = [],
        initialLayout = "table",
        pageSize = 10,
    } = opts;

    const [query, setQuery] = React.useState("");
    const deferredQuery = React.useDeferredValue(query);

    const [filters, setFilters] = React.useState<Record<FK, Option | null>>(
        () => ({ ...(initialFilters || {}) } as Record<FK, Option | null>)
    );

    const [selectedRows, setSelectedRows] = React.useState<Array<string | number>>([]);
    const [layout, setLayout] = React.useState<"table" | "list">(initialLayout);

    const ALL_KEYS = React.useMemo(() => columns.map((c) => String(c.key)), [columns]);
    const PINNED = React.useMemo(() => new Set(pinnedKeys.map(String)), [pinnedKeys]);
    const TOGGLEABLE_KEYS = React.useMemo(
        () => ALL_KEYS.filter((k) => !PINNED.has(k)),
        [ALL_KEYS, PINNED]
    );

    const [hiddenKeys, setHiddenKeys] = React.useState<string[]>([]);
    React.useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw) as string[];
            const sanitized = parsed.filter((k) => TOGGLEABLE_KEYS.includes(k));
            setHiddenKeys(sanitized);
        } catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [TOGGLEABLE_KEYS.join("|"), storageKey]);

    React.useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(hiddenKeys));
    }, [hiddenKeys, storageKey]);

    const visibleColumns = React.useMemo(
        () => columns.filter((c) => PINNED.has(String(c.key)) || !hiddenKeys.includes(String(c.key))),
        [columns, hiddenKeys, PINNED]
    );

    const visibleKeysForPicker = React.useMemo(
        () => TOGGLEABLE_KEYS.filter((k) => !hiddenKeys.includes(k)),
        [TOGGLEABLE_KEYS, hiddenKeys]
    );

    const toggleColumn = React.useCallback(
        (key: string, checked: boolean) => {
            setHiddenKeys((prev) => {
                if (checked) return prev.filter((k) => k !== key);
                if (!TOGGLEABLE_KEYS.includes(key) || prev.includes(key)) return prev;
                return [...prev, key];
            });
        },
        [TOGGLEABLE_KEYS]
    );
    const resetColumns = React.useCallback(() => setHiddenKeys([]), []);

    const setFilter = React.useCallback(
        (key: FK, opt: Option | null) => setFilters((prev) => ({ ...prev, [key]: opt })),
        []
    );

    const resetAll = React.useCallback(() => {
        setQuery("");
        setFilters({} as Record<FK, Option | null>);
    }, []);

    const filteredByFilters = React.useMemo(() => {
        if (!filterDefs) return data;
        const active = Object.entries(filters).filter(([, v]) => v && (v as Option).value) as [FK, Option][];
        if (active.length === 0) return data;

        return data.filter((row) =>
            active.every(([k, sel]) => {
                const accessor = filterDefs.field[k];
                const cell = typeof accessor === "function" ? accessor(row) : (row as any)[accessor];
                const s = String(cell ?? "").toLowerCase();
                return s.includes(String(sel.value).toLowerCase()) || s.includes(String(sel.label).toLowerCase());
            })
        );
    }, [data, filters, filterDefs]);

    const SEARCH_KEYS = React.useMemo(() => searchKeys.map(String), [searchKeys]);
    const rows = React.useMemo(() => {
        const base = filteredByFilters;
        const q = deferredQuery.trim().toLowerCase();
        if (!q) return base;
        const tokens = q.split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return base;

        return base.filter((row) => {
            const blob = SEARCH_KEYS.map((k) => String((row as any)[k] ?? "")).join(" ").toLowerCase();
            for (const t of tokens) if (!blob.includes(t)) return false;
            return true;
        });
    }, [filteredByFilters, SEARCH_KEYS, deferredQuery]);

    const onSelectionChange = React.useCallback((selected: Set<string | number>) => {
        const next = Array.from(selected);
        setSelectedRows((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next));
    }, []);

    const toggleLayout = React.useCallback(() => setLayout((v) => (v === "table" ? "list" : "table")), []);

    const [page, setPage] = React.useState(1);
    const size = pageSize ?? 10;
    const totalPages = React.useMemo(() => Math.max(1, Math.ceil(rows.length / size)), [rows.length, size]);
    React.useEffect(() => setPage((p) => (p > totalPages ? 1 : p)), [totalPages]);
    const pagedRows = React.useMemo(() => rows.slice((page - 1) * size, (page - 1) * size + size), [rows, page, size]);

    return {
        query,
        setQuery,
        deferredQuery,

        filters,
        setFilter,
        resetAll,

        selectedRows,
        setSelectedRows,
        onSelectionChange,

        layout,
        toggleLayout,

        hiddenKeys,
        visibleColumns,
        toggleableKeys: TOGGLEABLE_KEYS,
        visibleKeysForPicker,
        toggleColumn,
        resetColumns,

        page,
        setPage,
        pageSize: size,
        totalPages,

        rows,
        pagedRows,
    };
}

