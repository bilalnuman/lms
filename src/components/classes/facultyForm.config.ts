import { buildPeriod } from "@/helpers/period";
import { z } from "zod";
import type { FieldConfig } from "@/types";
import { batches, Education_Type } from "./json-data";
import { classes } from "@/helpers/classes";
import { sessions } from "@/utils/session-generator";
import { SelectOption } from "../Select";


export type SectionConfig = {
  title?: string;
  fields: FieldConfig[];
};

const period = buildPeriod();
export const periodOptions: SelectOption[] = period.months.map((m) => ({ value: m, label: m }));

export const formSections: SectionConfig[] = [
  {
    title: "Schedule Information",
    fields: [
      { name: "creation_Date", label: "Creation Date", type: "date", required: true },
      { name: "schedule_name", label: "Schedule Name", type: "text", required: true },
      { name: "period", label: "Period", type: "select", options: periodOptions, required: true },
      { name: "program", label: "Program", type: "select", options: Education_Type, required: true },
      { name: "class_year", label: "Class Year", type: "select", options: classes, required: true },
      { name: "session_year", label: "Session Year", type: "select", options: sessions(), required: true },
      { name: "from_batch", label: "From Batch #", type: "select", options: batches, required: true },
      { name: "to_batch", label: "To Batch #", type: "select", options: batches, required: true },
    ],
  },
];


const PERIOD_RE = /^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/;

export const scheduleSchema = z
  .object({
    creation_Date: z.string().min(1, "Creation Date is required"), 
    schedule_name: z.string().min(1, "Schedule Name is required"),

    period: z.string().regex(PERIOD_RE, "Invalid period (e.g., AUG-2025)"),

    program: z.string().min(1, "Program is required"),
    class_year: z.string().min(1, "Class year is required"),
    session_year: z.string().min(1, "Session year is required"),

    from_batch: z.string().min(1, "From Batch is required"),
    to_batch: z.string().min(1, "To Batch is required"),
  })
  .refine(
    (data) => {
      const idx = (v: string) => batches.findIndex((b) => b.value === v);
      const a = idx(data.from_batch);
      const b = idx(data.to_batch);
      return a === -1 || b === -1 || a <= b;
    },
    { path: ["to_batch"], message: "To Batch must be greater than or equal to From Batch" }
  );

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
