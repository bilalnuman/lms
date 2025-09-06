"use client"
import React from 'react'
import { Select } from './Select'
import Input from './Input'
import { Button } from './Button'
import { LuRefreshCw } from 'react-icons/lu'
import { FaRegListAlt } from 'react-icons/fa'
import ColumnVisibility from '../datatable/ColumnVisibility'
import ExportOptions from '../students/ExportOptions'
import { BULK_ACTIONS } from '@/utils/app-json.data'

export interface ToolbarProps {
    tk:any
}


const Toolbar = ({ tk }: ToolbarProps) => {
    const [bulk, setBulk] = React.useState<{ label: string; value: string } | null>(null);
    return (
        <div className="flex items-center justify-end gap-3">
            {tk.selectedRows.length > 0 && (
                <Select
                    options={BULK_ACTIONS}
                    value={bulk}
                    onChange={setBulk}
                    placeholder="Bulk actions…"
                    clearable
                    classNames={{ container: "!w-40" }}
                />
            )}
            <Input placeholder="Search" value={tk.query} onChange={(e) => tk.setQuery((e as any).target.value)} clearable />
            <div className="flex w-fit items-center">
                <Button onClick={tk.resetAll} leftIcon={<LuRefreshCw size={20} />} className="!gap-0 border-s !rounded-s-md !rounded-e-[0px]" variant="outline" title="Reset filters & search" />
                <Button onClick={tk.toggleLayout} leftIcon={<FaRegListAlt size={20} />} className="!gap-0 !rounded-none border-s" variant="outline" title={tk.layout === "table" ? "Switch to list" : "Switch to table"} />
                <div className="flex h-10 items-center border-y border-slate-300 px-1 pt-2">
                    <ColumnVisibility
                        columns={tk.toggleableKeys}
                        value={tk.visibleKeysForPicker}
                        onToggle={tk.toggleColumn}
                        onReset={tk.resetColumns}
                    />
                </div>
                <div className="flex h-10 items-center rounded-e-md border border-slate-300 px-1 pt-2">
                    <ExportOptions onClick={(key: string) => console.log("export", key)} />
                </div>
            </div>
        </div>
    )
}

export default Toolbar