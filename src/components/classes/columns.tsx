"use client";
import * as React from "react";
import TableActions from "../TableActions";
import { buildColumnsFromData } from "@/utils/columnGenerator";
import { withColumnOverrides } from "@/utils/column-overrides";
import { columnOorder } from "./json-data";
import type { Column } from "../datatable";
import { Button } from "../Button";
import { IoPrintOutline } from "react-icons/io5";

type SortDir = "asc" | "desc" | null;
export type Schedule = { id: number; program: any } & Record<string, any>;

export function buildColumns(
    schedules: Schedule[],
    getSortIcon: (d: SortDir) => React.ReactNode
): Column<Schedule>[] {
    const base = buildColumnsFromData<Schedule>(schedules, {
        order: columnOorder,
        exclude: ["id"],
        defaultSortable: true,
        getSortIcon,
        actions: {
            key: "actions",
            label: "Actions",
            sortable: false,
            render: (row) => (
                <TableActions row={row} onPress={(r, act) => console.log(act, r)}>
                    <Button
                        onClick={() => {}}
                        variant="ghost"
                        leftIcon={<IoPrintOutline className="text-black" size={20} />}
                        className="!p-1 !h-fit !gap-0"
                        title="Print Schedule"
                    />
                </TableActions>
            ),
        },
    });

    return withColumnOverrides<Schedule>(base, {
        program: {
            label: "Program #",
            render: (value: unknown, row: Schedule) => {
                console.log("full row:", row);

                return <strong>{row.program}</strong>;
            },
        },
    });

}
