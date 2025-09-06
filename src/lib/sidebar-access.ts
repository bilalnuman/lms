import type { NavItem } from "@/types/sidebar";
import { matchGuardForPath, checkAccess } from "./access-control";
import type { SessionUser } from "./auth";


/**
* Filter your sidebar items by the same guards used in middleware.
* No duplication of access logic.
*/
export function filterSidebarByAccess(items: NavItem[], user: SessionUser | null): NavItem[] {
const canSee = (href: string) => {
const guard = matchGuardForPath(href);
if (!guard) return true; // no explicit guard -> allowed
if (!user) return false;
return checkAccess(user, guard);
};


const normalizeHref = (h: string) => (h.startsWith("/") ? h : `/${h}`);


const deep = (arr: NavItem[]): NavItem[] =>
arr
.map((n) => ({ ...n, href: normalizeHref(n.href) }))
.filter((n) => canSee(n.href))
.map((n) => (n.children?.length ? { ...n, children: deep(n.children).filter(Boolean) } : n));


return deep(items);
}