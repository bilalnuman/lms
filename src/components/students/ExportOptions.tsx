import React from "react";
import { Dropdown } from "../Dropdown";
import { Button } from "../Button";
import { exportOptions } from "./json-data";
import { AiOutlineExport } from "react-icons/ai";


type Props = {
    onClick: (key: string) => void;
};

const ExportOptions: React.FC<Props> = ({ onClick }) => {

    return (
        <Dropdown
            label={<AiOutlineExport size={20} />}
            dropdown={{ right: 15, left: "unset", top: 10 }}
        >
            {exportOptions.map((type) => (
                <Button variant='ghost'
                    onClick={() => onClick(type.value)} key={type.value}
                    className='justify-start !capitalize'>
                    {type.label}
                </Button>
            ))}
        </Dropdown>
    );
};

export default ExportOptions;
