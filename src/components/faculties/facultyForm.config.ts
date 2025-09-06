// facultyForm.config.ts
import { FieldConfig, Option } from "@/types";
import { z } from "zod";

export type SectionConfig = {
  title?: string;
  fields: FieldConfig[];
};

export const genderOptions: Option[] = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Other", value: "other" },
];

export const maritalStatusOptions: Option[] = [
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Divorced", value: "divorced" },
  { label: "Widowed", value: "widowed" },
];

export const nationalityOptions: Option[] = [
  { label: "Pakistani", value: "pakistani" },
  { label: "Other", value: "other" },
];

export const formSections: SectionConfig[] = [
  {
    title: "Faculty Information",
    fields: [
      { name: "faculty", label: "Faculty #", type: "text" ,required:true},
      { name: "name", label: "Name", type: "text", required: true },
      { name: "pmdc", label: "PMDC #", type: "text" ,required:true},
      { name: "date_of_joining", label: "Date of Joining", type: "date", required: true },
      { name: "biomatric", label: "Biomatric #", type: "number" },
      { name: "gender", label: "Gender", type: "select", options: genderOptions, required: true },
      { name: "date_Of_birth", label: "Date of Birth", type: "date", required: true },
      { name: "marital_status", label: "Marital Status", type: "select", options: maritalStatusOptions, required: true },
      { name: "nationality", label: "Nationality", type: "select", options: nationalityOptions, required: true },
      { name: "cnic", label: "CNIC No", type: "text" ,required:true},
      { name: "department", label: "Department", type: "select", options: genderOptions, required: true },
      { name: "designation", label: "Designation", type: "select", options: genderOptions, required: true },
      { name: "phone", label: "Phone #", type: "text",required:true },
      { name: "email", label: "Email", type: "email",required:true},
      { name: "notes", label: "Additional Notes", type: "textarea", required: false, rows: 6, colSpan: 6 },
    ],
  },
];


export const facultySchema = z.object({
  faculty: z.string().min(1, "Faculty # is required"),
  name: z.string().min(1, "Name is required"),
  pmdc: z.string().min(1, "PMDC # is required"),
  date_of_joining: z.string().min(1, "Date of Joining is required"),
  biomatric: z.coerce.number().optional(),
  // @ts-ignore
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  date_Of_birth: z.string().min(1, "Date of Birth is required"),
  // @ts-ignore
  marital_status: z.enum(["single", "married", "divorced", "widowed"], { required_error: "Marital Status is required" }),
  nationality: z.string().min(1, "Nationality is required"),
  cnic: z.string().min(1, "CNIC is required"),
  department: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
});


export type FacultyFormValues = z.infer<typeof facultySchema>;
