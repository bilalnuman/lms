"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import type { NavItem } from "@/types/sidebar";
import { sidebarItems } from "../../app-json-data/sidebar";
import { FaRegArrowAltCircleLeft } from "react-icons/fa";
import { IoChevronDown } from "react-icons/io5";
import { Button } from "./Button";
import NavLink from "./NavLink";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const pathname = usePathname();

  const getActiveRoute = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const toggleOpen = (key: string) => {
    setOpenKey((prev) => (prev === key ? null : key));
  };

  // load collapsed + openKey from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebar-collapsed");
    if (savedCollapsed) setCollapsed(savedCollapsed === "true");

    const savedOpenKey = localStorage.getItem("sidebar-openKey");
    if (savedOpenKey) setOpenKey(savedOpenKey);
  }, []);

  useEffect(() => {
    const body=document.querySelector('body');
    collapsed?(body?.classList.add("hide"),setOpenKey(null)):body?.classList.remove("hide")
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (openKey) {
      localStorage.setItem("sidebar-openKey", openKey);
    } else {
      localStorage.removeItem("sidebar-openKey");
    }
  }, [openKey]);

  // auto expand parent if a child is active
  useEffect(() => {
    sidebarItems.forEach((item) => {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        setOpenKey(item.href);
      }
    });
  }, [pathname]);

  return (
    <aside
      className={clsx(
        "fixed top-0 h-screen border-r border-slate-200 pb-10 bg-gray-default pt-14 transition-all duration-200 overflow-x-auto scrollbar-hide",
        collapsed ? "w-16" : "w-56"
      )}
    >
      <div className="flex flex-col px-2">
        <Button
          variant="ghost"
          onClick={() => setCollapsed((v) => !v)}
          className="ms-auto my-1 !h-fit !p-0 hover:bg-transparent"
        >
          <FaRegArrowAltCircleLeft
            size={20}
            className={clsx(
              "transition-transform duration-700 text-dark-default",
              collapsed && "rotate-180"
            )}
          />
        </Button>

        <nav className="space-y-1">
          {sidebarItems.map((item: NavItem) => {
            const activeParent = getActiveRoute(item);
            const activeChild = item.children?.some((c) =>
              getActiveRoute(c)
            );
            const Icon: any = item.icon;

            return item.children?.length ? (
              <div key={item.href}>
                <Button
                  variant="ghost"
                  childrenClass={clsx(collapsed && "truncate sr-only")}
                  onClick={() => toggleOpen(item.href)}
                  className={clsx(
                    "gap-2 !rounded-lg !px-3 !py-2 !transition-colors !capitalize relative",
                    "hover:!bg-slate-100 !hover:text-dark-default w-full justify-between !font-normal !text-[15px]",
                    collapsed && "!justify-center",
                    activeParent && !activeChild && "bg-slate-100 text-dark-default",
                    activeChild && "bg-white text-dark-default",
                    
                  )}
                  leftIcon={<Icon size={20} />}
                  rightIcon={
                    !collapsed && (
                      <IoChevronDown
                        className={clsx(
                          "h-4 w-4 transition-transform duration-300 absolute end-2 top-3",
                          openKey === item.href && "rotate-180"
                        )}
                      />
                    )
                  }
                >
                  {item.title}
                </Button>
                <div
                  className={clsx(
                    "ml-2 overflow-hidden transition-[max-height] duration-300 ease-in-out",
                    openKey === item.href ? "max-h-96" : "max-h-0"
                  )}
                >
                  <div className="space-y-1 pl-2">
                    {item.children.map((c: NavItem) => (
                      <NavLink
                        key={c.href}
                        item={c}
                        collapsed={collapsed}
                        active={getActiveRoute(c)}
                        isChild
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                active={activeParent}
              />
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
