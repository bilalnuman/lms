"use client";
import * as React from "react";
import { Button } from "../Button";
import { Select, SelectOption } from "../Select";
import { batches, Education_Type, sessions } from "./json-data";
import { classes } from "../faculties/json-data";
import Input from "../Input";
import { IoCalendarClearOutline } from "react-icons/io5";
import { useTableKit } from "@/components/tablekit/useTableKit";
import Toolbar from "../Toolbar";
import TableWidget from "../TableWidget";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { buildColumns } from "./columns";
import { Column } from "../datatable";

const ClassSchedule = () => {
    const [education, setEducation] = React.useState<SelectOption<string> | null>(null);


    const schedules = React.useMemo<any[]>(
        () => [
            {
                id: 1, NameOfSchedule
                    : "3rd Year", program: "MBBS", batch: "3RD BATCH", SessionYear
                    : "2024-2025", ClassYear
                    : "3rd Year", From: "06-Aug-2025", To: "08-Aug-2025",
                CreatedBy: "Rizwan Shakeel",
                CreationDate: "06/08/2025 10:21:37",
                LastUpdateBy: "--",
                IsLocked: "--",
                SubmittedBy: "--",
                SubmissionDate: "--",
            },
            {
                id: 2, NameOfSchedule
                    : "3rd Year", program: "MBBS", batch: "3RD BATCH", SessionYear
                    : "2024-2025", ClassYear
                    : "3rd Year", From: "06-Aug-2025", To: "08-Aug-2025",
                CreatedBy: "Rizwan Shakeel",
                CreationDate: "06/08/2025 10:21:37",
                LastUpdateBy: "--",
                IsLocked: "--",
                SubmittedBy: "--",
                SubmissionDate: "--",
            },
        ],
        []
    );

    const getSortIcon = React.useCallback((direction: "asc" | "desc" | null) => {
        if (direction === "asc") return <FaSortUp />;
        if (direction === "desc") return <FaSortDown />;
        return <FaSort />;
    }, []);

    const columns = React.useMemo<Column<any>[]>(
        () => buildColumns(schedules, getSortIcon),
        [schedules, getSortIcon]
    );

    const tk = useTableKit<any>({
        data: schedules,
        columns,
        searchKeys: ["roll", "from", "batch", "className", "sessionName", "mobile", "email", "status"],
        storageKey: "studentListing:hiddenColumns",
        pinnedKeys: ["actions"],
        initialLayout: "table",
        pageSize: 10,
        
    });

    return (
        <div className="py-5 mt-3 relative">
            <Button
                as="a"
                href="/class-schedule/create"
                size="sm"
                className="absolute end-0 -top-[30px] text-xs !rounded"
            >
                Add new schedule
            </Button>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 mb-4">
                <Select
                    label="Education Type "
                    options={Education_Type}
                    value={education}
                    onChange={setEducation}
                    placeholder="Pick one…"
                    clearable
                />
                <Select
                    label="Class Name "
                    options={classes}
                    value={education}
                    onChange={setEducation}
                    placeholder="Pick one…"
                    clearable
                />
                <Select
                    label="Session Year "
                    options={sessions}
                    value={education}
                    onChange={setEducation}
                    placeholder="Pick one…"
                    clearable
                />
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 mb-10">
                <Select
                    label="Batch #"
                    options={batches}
                    value={education}
                    onChange={setEducation}
                    placeholder="Pick one…"
                    clearable
                    classNames={{ optionText: "uppercase" }}
                />
                <Input
                    label="From Date"
                    type="date" placeholder="YYYY-MM-DD"
                    pickerIcon={<IoCalendarClearOutline className="h-4 w-4" />}
                />
                <Input
                    label="To Date"
                    type="date" placeholder="YYYY-MM-DD"
                    pickerIcon={<IoCalendarClearOutline className="h-4 w-4" />}
                />
            </div>
            {/* Toolbar */}
            <Toolbar tk={tk} />

            <div className="mt-5 schedule-table table-class">
                <TableWidget tk={tk} />
            </div>
        </div>
    );
};

export default ClassSchedule;
