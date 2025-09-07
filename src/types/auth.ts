export type Role = "admin" | "faculty" | "student" | "guest";


export type Permission =
| "view:dashboard"
| "read:students"
| "read:faculties"
| "read:schedule"
| "write:results"
| "read:tasks"
| "submit:tasks"
| "read:trainings"
| "read:cme"
| "read:attendance"
| "read:questionaires"
| "read:ebooks"
| "read:feedback"
| "read:notifications"
| "read:reports"
| "manage:settings"
| "manage:user-settings"
| "read:widgets";


export type Guard = {
pattern: RegExp;
required: {
roles?: Role[];
permissions?: Permission[];
/** default "all"; set to "any" if either roles OR permissions should suffice */
mode?: "all" | "any";
};
};

export type LoginPayload = { email: string; password: string };
export type LoginResponse = {
  data?: { accessToken?: string; user?: any };
  message?: string;
  error?: string;
};