"use client";
import * as React from "react";
import { buildColumnsFromData } from "@/utils/columnGenerator";
import { Faculty } from "./types";
import { Column } from "../datatable";
import { columnOorder } from "./json-data";
import TableActions from "../widgets/TableActions";
type SortDir = "asc" | "desc" | null;


export function buildStudentColumns(
    faculties: Faculty[],
    getSortIcon: (d: SortDir) => React.ReactNode
): Column<Faculty>[] {
    return buildColumnsFromData(faculties, {
        order: columnOorder,
        exclude: ["id"],
        truncates: { doj:150, department: 150, designation: 150,contact:150,pmdcNo:150,name:150,regNo:150 },
        defaultSortable: true,
        getSortIcon,
        actions: {
            key: "actions",
            label: "Actions",
            sortable: false,
            render: (row: Faculty) => <TableActions row={row} onPress={(r, act) => console.log(act, r)} />,
        },
    });
}
