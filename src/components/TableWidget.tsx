import React from 'react'
import { ListView } from './ListView'
import Pagination from './datatable/Pagination'
import { DataTable } from './datatable'
export interface TableWidgetProps {
    tk: any
}
const TableWidget = ({ tk }: TableWidgetProps) => {
    return (
        <>

            {tk.layout === "table" ? (
                <DataTable
                    data={tk.pagedRows}
                    columns={tk.visibleColumns}
                    onSelectionChange={tk.onSelectionChange}
                    loading={false}
                    options={{ defaultSortKey: "id", defaultSortDirection: "asc", enableSelection: true, zebra: true }}
                    paginationComponent={
                        <div className="my-5 flex w-full items-center justify-center">
                            <Pagination currentPage={tk.page} totalPages={tk.totalPages} goToPage={(p: number) => tk.setPage(p)} />
                        </div>
                    }
                />
            ) : (
                <ListView items={tk.pagedRows} columns={tk.visibleColumns}>
                    <div className="my-5 flex w-full items-center justify-center">
                        <Pagination currentPage={tk.page} totalPages={tk.totalPages} goToPage={(p: number) => tk.setPage(p)} />
                    </div>
                </ListView>
            )}
        </>
    )
}

export default TableWidget