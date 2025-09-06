"use client";
import * as React from "react";
import { useTableKit } from "@/components/tablekit/useTableKit";
import { Select } from "@/components/widgets/Select";
import { Input } from "@/components/widgets/Input";
import { Button } from "@/components/widgets/Button";
import { Column } from "@/components/datatable";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { IoCalendarClearOutline } from "react-icons/io5";
import { buildStudentColumns, type Student as StudentRow } from "./columns";
import { status } from "./json-data";
import { sessions } from "@/utils/session-generator";
import Toolbar from "../widgets/Toolbar";
import TableWidget from "../widgets/TableWidget";
import { classes } from "../classes/json-data";

export const filterOptions = {
    Status: status,
    Class: classes,
    Session: sessions(),
    "Batch #": status,
} as const;

type FilterKey = keyof typeof filterOptions;

export default function StudentListing() {
    const students = React.useMemo<StudentRow[]>(
        () => [
            { id: 1, roll: "1001", from: "F-2024-01", batch: "B-01", className: "Mathematics - Algebra Basics", sessionName: "Morning Session", mobile: "+1 202 555 0123", email: "alice@example.com", status: "Active" },
            { id: 2, roll: "1002", from: "F-2024-02", batch: "B-01", className: "Mathematics - Algebra Basics", sessionName: "Morning Session", mobile: "+1 202 555 0189", email: "bob@example.com", status: "Active" },
            { id: 3, roll: "1003", from: "F-2024-03", batch: "B-02", className: "Physics - Mechanics", sessionName: "Afternoon Session", mobile: "+1 202 555 0199", email: "charlie@example.com", status: "Inactive" },
            { id: 4, roll: "1004", from: "F-2024-04", batch: "B-03", className: "Computer Science - Intro to Programming", sessionName: "Evening Session", mobile: "+1 202 555 0177", email: "diana@example.com", status: "Active" },
            { id: 5, roll: "1005", from: "F-2024-05", batch: "B-03", className: "English Literature - Poetry", sessionName: "Morning Session", mobile: "+1 202 555 0137", email: "ethan@example.com", status: "Pending" },
        ],
        []
    );

    const getSortIcon = React.useCallback((direction: "asc" | "desc" | null) => {
        if (direction === "asc") return <FaSortUp />;
        if (direction === "desc") return <FaSortDown />;
        return <FaSort />;
    }, []);

    const columns = React.useMemo<Column<StudentRow>[]>(
        () => buildStudentColumns(students, getSortIcon),
        [students, getSortIcon]
    );

    const tk = useTableKit<StudentRow>({
        data: students,
        columns,
        filters: {
            options: filterOptions,
            field: {
                Status: (r: any) => r.status,
                Class: (r: any) => r.className,
                Session: (r: any) => r.sessionName,
                "Batch #": (r: any) => r.batch,
            },
        },
        searchKeys: ["roll", "from", "batch", "className", "sessionName", "mobile", "email", "status"],
        storageKey: "studentListing:hiddenColumns",
        pinnedKeys: ["actions"],
        initialLayout: "table",
        pageSize: 10,
    });

    return (
        <div className="py-5 mt-3 relative">
            <Button as="a" href="/students/register" size="sm" className="absolute end-0 -top-[30px] text-xs !rounded">Register new student</Button>
            {/* Filters */}
            <div className="mb-10 grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {(Object.keys(filterOptions || {})).map((key: any) => {
                    const opts = filterOptions[key as FilterKey] || [];
                    return (
                        <div key={key}>
                            <label className="pb-1 text-sm">{key}</label>
                            <Select
                                options={opts}
                                // @ts-ignore
                                value={tk.filters?.[key]}
                                // @ts-ignore
                                onChange={(next) => tk.setFilter(key, next)}
                                placeholder="Pick one…"
                                clearable
                            />
                        </div>
                    );
                })}

                <Input label="Roll #" placeholder="you@company.com" />
                <Input label="Admission From Date" type="date" placeholder="YYYY-MM-DD" pickerIcon={<IoCalendarClearOutline className="h-4 w-4" />} />
                <Input label="Admission To Date" type="date" placeholder="YYYY-MM-DD" name="to_date" pickerIcon={<IoCalendarClearOutline className="h-4 w-4" />} />
            </div>

            {/* Toolbar */}
            <Toolbar tk={tk} />

            <div className="mt-5 table-class">
                <TableWidget tk={tk} />
            </div>
        </div>
    );
}
