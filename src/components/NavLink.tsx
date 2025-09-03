import { NavItem } from "@/types/sidebar";
import clsx from "clsx";
import Link from "next/link";

function NavLink({
    item,
    collapsed = false,
    active,
    isChild = false,
}: {
    item: NavItem;
    collapsed?: boolean;
    active: boolean;
    isChild?: boolean;
}) {
    const Icon = item.icon;
    const isExternal = item.external || item.href.startsWith("http");

    return (
        <Link
            href={item.href}
            className={clsx(
                "group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors capitalize",
                "!text-[15px]",
                active && !isChild && "bg-slate-100 text-dark-default ",
                !isChild && "hover:bg-slate-100 hover:text-dark-default",
                isChild && "hover:text-white",
                active && isChild && "text-white hover:text-white",
            )}
            aria-current={active ? "page" : undefined}
            {...(isExternal
                ? { target: "_blank", rel: "noreferrer" }
                : {})}
        >
            {Icon && <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />}
            <span className={clsx("truncate", collapsed && "sr-only")}>
                {item.title}
            </span>
            {typeof item.badge !== "undefined" && !collapsed && (
                <span className="ml-auto inline-flex items-center rounded-md bg-slate-200 px-2 py-0.5 text-xs font-medium">
                    {item.badge}
                </span>
            )}
        </Link>
    );
}
export default NavLink;
