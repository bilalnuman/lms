"use client";
import * as React from "react";
import TableActions from "../TableActions";
import { buildColumnsFromData } from "@/utils/columnGenerator";
import { columnOorder, classes, status } from "./json-data";
import { Column } from "../datatable";
import { sessionOptions } from "./studentForm.config";
type SortDir = "asc" | "desc" | null;

export type Student = { /* ...unchanged... */ };


export const filterOptions = {
    Status: status,
    Class: classes,
    Session: sessionOptions,
    "Batch #": status,
} as const;

export function buildStudentColumns(
    students: Student[],
    getSortIcon: (d: SortDir) => React.ReactNode
): Column<Student>[] {
    return buildColumnsFromData(students, {
        order: columnOorder,
        exclude: ["id"],
        labels: { from: "Form #", batch: "Batch #", className: "Class Name", sessionName: "Session Name", mobile: "Mobile #" },
        truncates: { batch: 100, className: 200, sessionName: 200, },
        strong: ["batch"],
        defaultSortable: true,
        getSortIcon,
        actions: {
            key: "actions",
            label: "Actions",
            sortable: false,
            render: (row: Student) => <TableActions row={row} onPress={(r, act) => console.log(act, r)} />,
        },
    });
}
