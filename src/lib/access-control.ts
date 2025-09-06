// src/lib/access-control.ts
import type { Guard, Permission, Role } from "@/types/auth";
import type { SessionUser } from "./auth";

// -------- Route categories --------
export const LOGIN_ROUTE = "/";
export const DEFAULT_AFTER_LOGIN_ROUTE = "/dashboard";



const PUBLIC_ROUTES = new Set<string>([
  "/",
  LOGIN_ROUTE,
  "/register",
  "/forgot-password",
  "/reset-password",
  "/_health",
  "/api/health",
]);

const AUTH_ROUTES = new Set<string>([
  LOGIN_ROUTE,
  "/register",
  "/forgot-password",
  "/reset-password",
]);

const PUBLIC_API_PATTERNS = [
  /^\/api\/session$/,                             // set access cookie
  /^\/api\/logout$/,                              // clear access cookie
  /^\/api\/backend\/api\/v1\/auth\/login$/,       // proxied backend login
  /^\/api\/backend\/auth\/refresh$/,              // (if you have a refresh proxy)
  /^\/api\/health$/,                              // your existing example
];



export function isPublicRoute(pathname: string) {
  const p = normalize(pathname);
  if (PUBLIC_ROUTES.has(p)) return true;
  return PUBLIC_API_PATTERNS.some(rx => rx.test(p));
}
export function isAuthRoute(pathname: string) {
  return AUTH_ROUTES.has(normalize(pathname));
}
export function isProtectedRoute(pathname: string) {
  return !isPublicRoute(pathname);
}

// -------- RBAC: roles -> permissions --------
// Use "*" to grant all permissions (e.g., admin)
export const ROLE_PERMISSIONS: Record<Role, Permission[] | ["*"]> = {
  admin: ["*"],
  faculty: [
    "view:dashboard",
    "read:students",
    "read:faculties",
    "read:schedule",
    "write:results",
    "read:tasks",
    "submit:tasks",
    "read:trainings",
    "read:cme",
    "read:attendance",
    "read:questionaires",
    "read:ebooks",
    "read:feedback",
    "read:notifications",
    "read:reports",
    "manage:user-settings",
    "read:widgets",
  ],
  student: [
    "view:dashboard",
    "read:schedule",
    "submit:tasks",
    "read:trainings",
    "read:questionaires",
    "read:ebooks",
    "read:notifications",
    "manage:user-settings",
    "read:widgets",
  ],
  guest: [],
};

// -------- Route guards (first match wins) --------
const ROUTE_GUARDS: Guard[] = [
  { pattern: /^\/dashboard\/?$/, required: { permissions: ["view:dashboard"] } },

  { pattern: /^\/students(\/.*)?$/, required: { permissions: ["read:students"] } },
  { pattern: /^\/faculties(\/.*)?$/, required: { permissions: ["read:faculties"] } },

  { pattern: /^\/class-schedule(\/.*)?$/, required: { permissions: ["read:schedule"] } },
  { pattern: /^\/exams-schedule(\/.*)?$/, required: { permissions: ["read:schedule"] } },
  { pattern: /^\/add-result(\/.*)?$/, required: { permissions: ["write:results"] } },

  { pattern: /^\/tasks(\/.*)?$/, required: { permissions: ["read:tasks"] } },
  { pattern: /^\/receive-tasks(\/.*)?$/, required: { permissions: ["submit:tasks"] } },

  // Accept both spellings just in case (your list had a typo: "satudent-trainings")
  { pattern: /^\/student-trainings(\/.*)?$/, required: { permissions: ["read:trainings"] } },
  { pattern: /^\/satudent-trainings(\/.*)?$/, required: { permissions: ["read:trainings"] } },
  { pattern: /^\/training-requests(\/.*)?$/, required: { permissions: ["read:trainings"] } },

  { pattern: /^\/cme-tracking(\/.*)?$/, required: { permissions: ["read:cme"] } },

  { pattern: /^\/defaulters(\/.*)?$/, required: { permissions: ["read:reports"] } },

  { pattern: /^\/attendance(\/.*)?$/, required: { permissions: ["read:attendance"] } },

  { pattern: /^\/questionaires(\/.*)?$/, required: { permissions: ["read:questionaires"] } },
  { pattern: /^\/quiz-list(\/.*)?$/, required: { permissions: ["read:questionaires"] } },
  { pattern: /^\/quiz-dashboard(\/.*)?$/, required: { permissions: ["read:questionaires"] } },

  { pattern: /^\/marks-summary(\/.*)?$/, required: { permissions: ["read:reports"] } },
  { pattern: /^\/question-wise-marks(\/.*)?$/, required: { permissions: ["read:reports"] } },
  { pattern: /^\/marks-detail(\/.*)?$/, required: { permissions: ["read:reports"] } },

  { pattern: /^\/e-book(\/.*)?$/, required: { permissions: ["read:ebooks"] } },
  { pattern: /^\/students-feedback(\/.*)?$/, required: { permissions: ["read:feedback"] } },
  { pattern: /^\/notifications(\/.*)?$/, required: { permissions: ["read:notifications"] } },

  { pattern: /^\/reports-analysis(\/.*)?$/, required: { permissions: ["read:reports"] } },
  { pattern: /^\/classes-schedule(\/.*)?$/, required: { permissions: ["read:reports"] } },
  { pattern: /^\/students-list(\/.*)?$/, required: { permissions: ["read:reports"] } },
  { pattern: /^\/monthly-attendance-report(\/.*)?$/, required: { permissions: ["read:reports"] } },

  // Settings: restrict to admin role and a specific permission
  { pattern: /^\/settings(\/.*)?$/, required: { roles: ["admin"], permissions: ["manage:settings"] } },
  { pattern: /^\/user-settings(\/.*)?$/, required: { permissions: ["manage:user-settings"] } },

  { pattern: /^\/change-password(\/.*)?$/, required: { permissions: ["manage:user-settings"] } },
  { pattern: /^\/logout\/?$/, required: { permissions: ["manage:user-settings"] } },

  { pattern: /^\/widgets(\/.*)?$/, required: { permissions: ["read:widgets"] } },
];

export function matchGuardForPath(pathname: string): Guard | null {
  const p = normalize(pathname);
  for (const g of ROUTE_GUARDS) if (g.pattern.test(p)) return g;
  return null;
}

export function checkAccess(user: SessionUser, guard: Guard): boolean {
  const requiredRoles = (guard.required.roles || []).map((r) => r.toLowerCase());
  const requiredPerms = (guard.required.permissions || []).map((p) => p.toLowerCase());
  const mode = guard.required.mode || "all"; // "all" (default) or "any"

  const effective = new Set<string>(expandPermissions(user));
  const hasWildcard = effective.has("*");
  const hasAnyRole =
    requiredRoles.length === 0 || user.roles.some((r) => requiredRoles.includes(r));
  const hasAllPerms =
    hasWildcard || requiredPerms.every((rp) => effective.has(rp));
  const hasAnyPerm =
    hasWildcard || requiredPerms.some((rp) => effective.has(rp));

  if (requiredRoles.length && requiredPerms.length) {
    return mode === "any" ? hasAnyRole || hasAnyPerm : hasAnyRole && hasAllPerms;
  }
  if (requiredRoles.length) return hasAnyRole;
  if (requiredPerms.length) return mode === "any" ? hasAnyPerm : hasAllPerms;
  return true;
}

export function expandPermissions(user: SessionUser): string[] {
  const perms = new Set<string>(user.permissions.map((p) => p.toLowerCase()));
  for (const role of user.roles as Role[]) {
    const fromRole = ROLE_PERMISSIONS[role] || [];
    if ((fromRole as any)[0] === "*") return ["*"]; // wildcard -> all
    for (const p of fromRole as Permission[]) perms.add(p.toLowerCase());
  }
  return Array.from(perms);
}

function normalize(p: string) {
  if (!p.startsWith("/")) return "/" + p;
  return p.endsWith("/") && p !== "/" ? p.slice(0, -1) : p;
}

// Re-export for UI composition (e.g., to filter a sidebar)
export { ROUTE_GUARDS };
