import React from "react";
import { Dropdown } from "../Dropdown";
import { Button } from "../Button";
import { BiSolidDashboard } from "react-icons/bi";
import Input from "../Input";

type Props = {
    columns: string[];
    value: string[];
    onToggle: (key: string, checked: boolean) => void;
    onReset: () => void;
};

const ColumnVisibility: React.FC<Props> = ({ columns, value, onToggle, onReset }) => {
    const isVisible = (k: string) => value.includes(k);

    return (
        <Dropdown
            label={<BiSolidDashboard size={20} />}
            dropdown={{ right: 15, left: "unset", top: 10 }}
            closeOnSelect={false}
        >
            {columns.map((col) => (
                <Input
                    key={col}
                    type="checkbox"
                    id={`col-${col}`}
                    label={col}
                    checked={isVisible(col)}
                    onChange={(e) => {
                        const el = e.currentTarget as HTMLInputElement;
                        onToggle(col, el.checked);
                    }}
                    classNames={{
                        container: "flex",
                        wrapper: "flex items-center gap-2 p-1",
                        input: "!h-4 !w-4",
                        label: "order-1 !mb-0 capitalize",
                    }}
                />
            ))}
            {
                value.length !== columns.length &&
                <Button variant="outline" className="mt-2 !h-7" onClick={onReset}>
                    Reset
                </Button>
            }
        </Dropdown>
    );
};

export default ColumnVisibility;
