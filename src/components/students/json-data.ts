import { ordinal } from "@/helpers/ordinal";
import { SelectOption } from "../Select";

const statusLabels = ["active", "left", "detainee", "migrated"];

export const status: SelectOption[] = [];
for (const s of statusLabels) {
    status.push({ value: s, label: s });
}
export const columnOorder = ["roll", "from", "batch", "className", "sessionName", "mobile", "email", "status"]
