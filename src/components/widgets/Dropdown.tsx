"use client";
import { useState, useRef, useEffect, CSSProperties } from "react";
import { createPortal } from "react-dom";

interface Props {
  children: React.ReactNode;
  label?: string | React.ReactNode;
  portalTarget?: HTMLElement | null;
  portalId?: string;
  closeOnSelect?: boolean;
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
  closeOnSelect = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [open, dropdown]);

  // Close when clicking outside
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
  const handleMenuClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnSelect) return;
    const target = e.target as HTMLElement;
    const clickable = target.closest(
      '[data-dropdown-item],button,a,[role="menuitem"],[role="option"]'
    );
    if (clickable) setOpen(false);
  };

  return (
    <div className={`relative inline-block ${classNames?.container ?? ""}`}>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center rounded-md cursor-pointer ${classNames?.button ?? ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span
          className={`flex items-center justify-center text-sm ${classNames?.label ?? ""}`}
        >
          {label}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`ml-1 h-5 w-5 transition-transform text-black ${
            open ? "rotate-180" : ""
          } ${classNames?.icon ?? ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <Portal target={portalTarget} targetId={portalId}>
          <div
            ref={menuRef}
            onClick={handleMenuClick}
            style={{
              position: "absolute",
              top: pos.top,
              left: dropdown?.left ?? pos.left,
              right: dropdown?.right,
              bottom: dropdown?.bottom,
              width: dropdown?.width,
              height: dropdown?.height,
              maxHeight: dropdown?.maxHeight,
              maxWidth: dropdown?.maxWidth,
              minHeight: dropdown?.minHeight,
              minWidth: buttonRef.current?.offsetWidth,
              overflow: dropdown?.overflow,
              overflowX: dropdown?.overflowX,
              overflowY: dropdown?.overflowY,
              zIndex: 50,
            }}
            className={`flex flex-col rounded-md border border-slate-200 bg-white p-2 shadow-lg max-h-[300px] overflow-auto ${
              classNames?.menu ?? ""
            }`}
            role="menu"
          >
            {children}
          </div>
        </Portal>
      )}
    </div>
  );
}

interface PortalProps {
  children: React.ReactNode;
  target?: HTMLElement | null;
  targetId?: string;
}

export function Portal({ children, target, targetId }: PortalProps) {
  const [mounted, setMounted] = useState(false);
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    if (target) {
      setElement(target);
    } else if (targetId) {
      setElement(document.getElementById(targetId));
    } else {
      setElement(document.body);
    }
  }, [target, targetId]);

  if (!mounted || !element) return null;
  return createPortal(children, element);
}
