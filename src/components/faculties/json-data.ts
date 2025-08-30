// If you already have this type, reuse it.
export type SelectOption = { value: string; label: string };

// helper: ordinal suffix
function ordinal(n: number) {
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
    switch (n % 10) {
        case 1: return `${n}st`;
        case 2: return `${n}nd`;
        case 3: return `${n}rd`;
        default: return `${n}th`;
    }
}

// STATUS (loop)
const statusLabels = ["active", "left", "detainee", "migrated"];
export const status: SelectOption[] = [];
for (const s of statusLabels) {
    status.push({ value: s, label: s });
}

// CLASSES (loop) — change maxYear if you need more 
const maxYear = 6;
export const classes: SelectOption[] = [];
for (let i = 1; i <= maxYear; i++) {
    classes.push({ value: String(i), label: `${ordinal(i)} year` });
}

export const columnOorder = ["roll", "from", "batch", "className", "sessionName", "mobile", "email", "status"]
export const exportOptions = [
    { value: "csv", label: "CSV" },
    { value: "xlsx", label: "Excel (XLSX)" },
    { value: "pdf", label: "PDF" },
    { value: "xml", label: "xml" },
    { value: "text", label: "text" },
    { value: "sql", label: "sql" },
];