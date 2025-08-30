export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "select"
  | "textarea"
  | "radio";
  export type Option = { label: string; value: string };
  export type FieldConfig = {
    name: string;
    label: string;
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    options?: Option[];
    colSpan?: number;
    rows?: number;
  };