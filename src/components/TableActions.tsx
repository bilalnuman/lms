import React from 'react'
import { Button } from './Button'
import { FaEye, FaPen, FaTrash } from 'react-icons/fa'

interface TableActionsProps {
    row: any;
    onPress: (row: any, actionType: string) => void;
}

const TableActions = ({ onPress, row }: TableActionsProps) => {
    return (
        <div className="inline-flex items-center gap-2">
            <Button
                onClick={() => onPress(row, 'view')}
                variant="ghost"
                leftIcon={<FaEye className="text-green-500" size={18} />}
                className="!p-1 !h-fit !gap-0"
            />
            <Button
                onClick={() => onPress(row, 'edit')}
                variant="ghost"
                leftIcon={<FaPen className="text-blue-500" size={16} />}
                className="!p-1 !h-fit !gap-0"
            />
            <Button
                onClick={() => onPress(row, 'delete')}
                variant="ghost"
                leftIcon={<FaTrash className="text-red-500" size={16} />}
                className="!p-1 !h-fit !gap-0"
            />
        </div>
    )
}

export default TableActions