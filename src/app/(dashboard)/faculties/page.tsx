"use client";
import * as React from "react";
import { useTableKit } from "@/components/tablekit/useTableKit";
import { Button } from "@/components/widgets/Button";
import { Column } from "@/components/datatable";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import Toolbar from "@/components/widgets/Toolbar";
import TableWidget from "@/components/widgets/TableWidget";
import { Faculty } from "@/components/faculties/types";
import { buildStudentColumns } from "@/components/faculties/columns";

export default function FacultytListing() {

    const faculties = React.useMemo<Faculty[]>(
        () => [
            {
                id: 1,
                regNo: "F-1001",
                name: "Dr. Ayesha Khan",
                pmdcNo: "PMDC-12345",
                doj: "2020-08-15",
                department: "Anatomy",
                designation: "Assistant Professor",
                contact: "+92 300 1234567",
            },
            {
                id: 2,
                regNo: "F-1002",
                name: "Dr. Bilal Ahmed",
                pmdcNo: "PMDC-67890",
                doj: "2019-02-10",
                department: "Physiology",
                designation: "Associate Professor",
                contact: "+92 333 7654321",
            },
            {
                id: 3,
                regNo: "F-1003",
                name: "Dr. Sara Malik",
                pmdcNo: "PMDC-11223",
                doj: "2021-05-20",
                department: "Biochemistry",
                designation: "Lecturer",
                contact: "+92 321 9988776",
            },
            {
                id: 4,
                regNo: "F-1004",
                name: "Dr. Imran Shah",
                pmdcNo: "PMDC-44556",
                doj: "2018-11-03",
                department: "Pathology",
                designation: "Professor",
                contact: "+92 345 1122334",
            },
            {
                id: 5,
                regNo: "F-1005",
                name: "Dr. Nida Farooq",
                pmdcNo: "PMDC-77889",
                doj: "2022-01-12",
                department: "Pharmacology",
                designation: "Senior Registrar",
                contact: "+92 312 5566778",
            },
        ],
        []
    );

    const getSortIcon = React.useCallback((direction: "asc" | "desc" | null) => {
        if (direction === "asc") return <FaSortUp />;
        if (direction === "desc") return <FaSortDown />;
        return <FaSort />;
    }, []);

    const columns = React.useMemo<Column<Faculty>[]>(
        () => buildStudentColumns(faculties, getSortIcon),
        [faculties, getSortIcon]
    );

    const tk = useTableKit<Faculty>({
        data: faculties,
        columns,
        searchKeys: [
            "regNo",
            "name",
            "pmdcNo",
            "doj",
            "department",
            "designation",
            "contact",
        ],
        storageKey: "facultyListing:hiddenColumns",
        pinnedKeys: ["actions"],
        initialLayout: "table",
        pageSize: 10,
    })

    return (
        <div className="py-5 mt-10 relative">
            <Button as="a" href="/faculties/register" size="sm" className="absolute end-0 -top-[60px] text-xs !rounded" label="Register new faculty" />


            {/* Toolbar */}
            <Toolbar tk={tk} />

            <div className="mt-5 table-class">
                <TableWidget tk={tk} />
            </div>
        </div>
    );
}
