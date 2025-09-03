import { Option } from "@/types";
import { SelectOption } from "../Select";
import { ordinal } from "@/helpers/ordinal";
import { sessions as sessionsGenerator } from "@/utils/session-generator";

export const Education_Type: Option[] = [
    { label: "dpt", value: "dpt" },
    { label: "mbbs", value: "mbbs" },
    { label: "bds", value: "bds" },
]

const maxYear = 6;

export const classes: SelectOption[] = [];

for (let i = 1; i <= maxYear; i++) {
    classes.push({ value: String(i), label: `${ordinal(i)} year` });
}

export const sessions = sessionsGenerator()

export const batches: SelectOption[] = [
    { label: "1nd batch", value: "1nd_batch" },
    { label: "2nd batch", value: "2nd_batch" },
    { label: "3nd batch", value: "3nd_batch" },
    { label: "f", value: "f" },
    { label: "e", value: "e" },
    { label: "d", value: "d" },
];

export const columnOorder=[]