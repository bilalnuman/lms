"use client";
import { useState, useRef, useEffect, CSSProperties } from "react";
import clsx from "clsx";
import { IoChevronDown } from "react-icons/io5";
import { Portal } from "./Portal";

interface Props {
  children: React.ReactNode;
  label?: string | React.ReactNode;
  portalTarget?: HTMLElement | null;
  portalId?: string;
  closeOnSelect?: boolean; // NEW: default true
  classNames?: {
    button?: string;
    label?: string;
    icon?: string;
    container?: string;
    menu?: string;
  };
  dropdown?: {
    top?: number | string;
    left?: number | string;
    right?: number | string;
    bottom?: number | string;
    width?: number;
    height?: number;
    maxHeight?: number;
    maxWidth?: number;
    minHeight?: number;
    minWidth?: number;
    // overflow settings
    overflow?: CSSProperties["overflow"];
    overflowX?: CSSProperties["overflowX"];
    overflowY?: CSSProperties["overflowY"];
  };
}

export function Dropdown({
  children,
  label,
  portalTarget,
  portalId,
  classNames,
  dropdown,
  closeOnSelect = true, // default behavior
}: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null); // NEW
  const [pos, setPos] = useState({ top: 0, left: 0 });

  // calculate position
  useEffect(() => {
    if (open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = buttonRef.current.offsetWidth || 160;
      const viewportWidth = window.innerWidth;

      let left = rect.left + window.scrollX - 15;
      if (left + dropdownWidth > viewportWidth - 8) {
        left = viewportWidth - dropdownWidth - 15;
      }
      if (left < 8) left = 15;

      setPos({
        top: rect.bottom + window.scrollY + Number(dropdown?.top ?? 5),
        left,
      });
    }
  }, [open]);

  // close on outside click (but not when clicking inside the menu)
  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  // close when selecting an item (delegated)
  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnSelect) return;
    const target = e.target as HTMLElement;
    const clickable = target.closest(
      '[data-dropdown-item],button,a,[role="menuitem"],[role="option"]'
    );
    if (clickable) setOpen(false);
  };

  return (
    <div className={clsx("relative inline-block", classNames?.container)}>
      {/* trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={clsx("inline-flex items-center rounded-md cursor-pointer", classNames?.button)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={clsx("flex items-center justify-center text-sm", classNames?.label)}>
          {label}
        </span>
        <IoChevronDown
          className={clsx(
            "ml-1 transition-transform",
            open && "rotate-180",
            classNames?.icon
          )}
        />
      </button>

      {/* menu */}
      {open && (
        <Portal target={portalTarget} targetId={portalId}>
          <div
            ref={menuRef}
            onClick={handleMenuClick}
            style={{
              position: "absolute",
              top:pos.top,
              left: dropdown?.left ?? pos.left,
              right: dropdown?.right,
              bottom: dropdown?.bottom,
              width: dropdown?.width,
              height: dropdown?.height,
              maxHeight: dropdown?.maxHeight,
              maxWidth: dropdown?.maxWidth,
              minHeight: dropdown?.minHeight,
              overflow: dropdown?.overflow,
              overflowX: dropdown?.overflowX,
              overflowY: dropdown?.overflowY,
              minWidth: buttonRef.current?.offsetWidth,
              zIndex: 50,
            }}
            className={clsx(
              "flex flex-col rounded-md border border-slate-200 bg-white p-2 shadow-lg max-h-[300px] overflow-auto",
              classNames?.menu
            )}
            role="menu"
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
}
