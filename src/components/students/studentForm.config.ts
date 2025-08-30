// studentForm.config.ts
import { z } from "zod";

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
  name: string;              // API field name (camelCase)
  label: string;             // UI label
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: Option[];        // for select / radio
  colSpan?: number;          // 1-6 (Tailwind grid col-span)
  rows?: number;             // for textarea
};

export type SectionConfig = {
  title?: string;
  fields: FieldConfig[];
};

export const yesNo: Option[] = [
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

export const statusOptions: Option[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Pending", value: "pending" },
];

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

export const classYearOptions: Option[] = [
  { label: "1st Year", value: "1" },
  { label: "2nd Year", value: "2" },
  { label: "3rd Year", value: "3" },
  { label: "4th Year", value: "4" },
];

export const sessionOptions: Option[] = [
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Evening", value: "evening" },
];

export const programOptions: Option[] = [
  { label: "BS Nursing", value: "bs-nursing" },
  { label: "Post RN", value: "post-rn" },
  { label: "LPN", value: "lpn" },
];

export const nationalityOptions: Option[] = [
  { label: "Pakistani", value: "pakistani" },
  { label: "Other", value: "other" },
];

export const applicantStatusOptions: Option[] = [
  { label: "Pakistani Student", value: "pakistani" },
  { label: "Overseas Pakistani Student", value: "overseas" },
  { label: "Foreign Student", value: "foreign" },
];

export const formSections: SectionConfig[] = [
  {
    title: "Basic",
    fields: [
      { name: "admissionDate", label: "Admission Date", type: "date", required: true },
      { name: "roll", label: "Roll #", type: "text", required: true },
      { name: "classYear", label: "Class Year", type: "select", options: classYearOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions, colSpan: 1 },
    ],
  },
  {
    fields: [
      { name: "candidateName", label: "Name of the Candidate (in Block Letters)", type: "text", required: true, colSpan: 3 },
      { name: "fatherName", label: "Father Name (in Block Letters)", type: "text", required: true, colSpan: 3 },
    ],
  },
  {
    fields: [
      { name: "session", label: "Session", type: "select", options: sessionOptions },
      { name: "programName", label: "Program Name", type: "select", options: programOptions, required: true },
      { name: "batch", label: "Batch #", type: "text", required: true },
      { name: "biometricId", label: "Biometric ID", type: "text", required: true },
    ],
  },
  {
    fields: [
      { name: "formNo", label: "Form No.", type: "text", required: true },
      { name: "meritNo", label: "Merit No.", type: "text" },
      { name: "gender", label: "Gender", type: "select", options: genderOptions, required: true },
      { name: "maritalStatus", label: "Marital Status", type: "select", options: maritalStatusOptions, required: true },
      { name: "dateOfBirth", label: "Date of Birth", type: "date", required: true },
      { name: "domicile", label: "Domicile", type: "text" },
    ],
  },
  {
    fields: [
      { name: "nationality", label: "Nationality", type: "select", options: nationalityOptions, required: true },
      { name: "cnic", label: "C.N.I.C No.", type: "text", required: true },
      { name: "passportNo", label: "Passport No.", type: "text" },
      { name: "applicantMobile", label: "Applicant's Mobile No.", type: "tel", required: true },
      { name: "email", label: "E-mail", type: "email", required: true, colSpan: 2 },
    ],
  },
  {
    fields: [
      { name: "currentAddress", label: "Current Residential Address", type: "textarea", required: true, rows: 2, colSpan: 6 },
      { name: "permanentAddress", label: "Permanent Address", type: "textarea", rows: 2, colSpan: 6 },
    ],
  },
  {
    title: "Father / Guardian",
    fields: [
      { name: "fatherGuardianName", label: "Father's/Guardian's Name", type: "text" },
      { name: "fatherOccupation", label: "Occupation", type: "text" },
      { name: "fatherEducation", label: "Father's Educational Qualifications", type: "text" },
      { name: "fatherPhoneHome", label: "Phone Home", type: "tel" },
      { name: "fatherOfficeMobile", label: "Office / Mob", type: "tel" },
      { name: "fatherEmail", label: "E-mail", type: "email" },
      { name: "fatherSalary", label: "Father's Salary", type: "number" },
      { name: "fatherOtherIncome", label: "Other Source of Income", type: "text" },
    ],
  },
  {
    title: "Mother",
    fields: [
      { name: "motherName", label: "Mother's Name", type: "text", required: true },
      { name: "motherOccupation", label: "Occupation", type: "text" },
      { name: "motherEducation", label: "Mother's Educational Qualifications", type: "text" },
      { name: "motherPhoneHome", label: "Phone Home", type: "tel" },
      { name: "motherOfficeMobile", label: "Office / Mob", type: "tel" },
      { name: "motherEmail", label: "E-mail", type: "email" },
      { name: "motherSalary", label: "Mother's Salary", type: "number" },
      { name: "motherOtherIncome", label: "Other Source of Income", type: "text" },
    ],
  },
  {
    title: "Family",
    fields: [
      { name: "siblingsCount", label: "No. of Siblings", type: "number" },
      { name: "brothers", label: "Brothers", type: "number" },
      { name: "sisters", label: "Sisters", type: "number" },
    ],
  },
  {
    title: "Emergency Contact",
    fields: [
      { name: "emergencyName", label: "Contact Name (in case of Emergency)", type: "text", required: true, colSpan: 2 },
      { name: "emergencyRelation", label: "Relation", type: "text" },
      { name: "emergencyMobile", label: "Mobile", type: "tel", required: true },
      { name: "phone1", label: "Phone 1", type: "tel" },
      { name: "phone2", label: "Phone 2", type: "tel" },
      { name: "phone3", label: "Phone 3", type: "tel" },
      { name: "postalAddress", label: "Postal Address", type: "textarea", rows: 2, colSpan: 6 },
    ],
  },
  {
    title: "Declarations",
    fields: [
      { name: "admittedPreviously", label: "Admitted previously to Medical/Dental undergraduate programme?", type: "radio", options: yesNo, required: true, colSpan: 3 },
      { name: "applicantStatus", label: "Status of Applicant (Tick One)", type: "radio", options: applicantStatusOptions, required: true, colSpan: 3 },
      { name: "hostelAccommodation", label: "Hostel Accommodation", type: "radio", options: yesNo, required: true, colSpan: 3 },
      { name: "medicalUnwellness", label: "Do you have any medical unwellness?", type: "radio", options: yesNo, colSpan: 3 },
      { name: "takingMedication", label: "Are you taking any kind of medication?", type: "radio", options: yesNo, colSpan: 3 },
    ],
  },
];

// ---------- Zod schema (basic constraints) ----------
export const studentSchema = z.object({
  admissionDate: z.string().min(1, "Required"),
  roll: z.string().min(1, "Required"),
  classYear: z.string().optional(),
  status: z.string().optional(),

  candidateName: z.string().min(1, "Required"),
  fatherName: z.string().min(1, "Required"),

  session: z.string().optional(),
  programName: z.string().min(1, "Required"),
  batch: z.string().min(1, "Required"),
  biometricId: z.string().min(1, "Required"),

  formNo: z.string().min(1, "Required"),
  meritNo: z.string().optional(),
  gender: z.string().min(1, "Required"),
  maritalStatus: z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  domicile: z.string().optional(),

  nationality: z.string().min(1, "Required"),
  cnic: z.string().min(1, "Required"),
  passportNo: z.string().optional(),
  applicantMobile: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),

  currentAddress: z.string().min(1, "Required"),
  permanentAddress: z.string().optional(),

  fatherGuardianName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherEducation: z.string().optional(),
  fatherPhoneHome: z.string().optional(),
  fatherOfficeMobile: z.string().optional(),
  fatherEmail: z.string().email().optional().or(z.literal("")),
  fatherSalary: z.coerce.number().optional(),
  fatherOtherIncome: z.string().optional(),

  motherName: z.string().min(1, "Required"),
  motherOccupation: z.string().optional(),
  motherEducation: z.string().optional(),
  motherPhoneHome: z.string().optional(),
  motherOfficeMobile: z.string().optional(),
  motherEmail: z.string().email().optional().or(z.literal("")),
  motherSalary: z.coerce.number().optional(),
  motherOtherIncome: z.string().optional(),

  brothers: z.coerce.number().optional(),
  sisters: z.coerce.number().optional(),
  siblingsCount: z.coerce.number().optional(),

  emergencyName: z.string().min(1, "Required"),
  emergencyRelation: z.string().optional(),
  emergencyMobile: z.string().min(1, "Required"),
  phone1: z.string().optional(),
  phone2: z.string().optional(),
  phone3: z.string().optional(),
  postalAddress: z.string().optional(),

  admittedPreviously: z.string().min(1, "Required"),
  applicantStatus: z.string().min(1, "Required"),
  hostelAccommodation: z.string().min(1, "Required"),
  medicalUnwellness: z.string().optional(),
  takingMedication: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentSchema>;
