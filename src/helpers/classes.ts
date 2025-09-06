import { SelectOption } from "@/components/widgets/Select";
import { ordinal } from "./ordinal";

const maxYear = 6;

export const classes: SelectOption[] = [];

for (let i = 1; i <= maxYear; i++) {
    classes.push({ value: String(i), label: `${ordinal(i)} year` });
}