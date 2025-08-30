"use client";
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties,
  KeyboardEvent,
} from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";

/* ===========================
   Types
=========================== */
export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
};

type ClassNames = Partial<{
  container: string;
  control: string;
  controlFocused: string;
  value: string;
  input: string;
  placeholder: string;
  icon: string;
  clear: string;
  tag: string;
  tagRemove: string;
  menu: string;
  option: string;
  optionActive: string;
  optionSelected: string;
  noOptions: string;

  // NEW label/error slots
  label: string;
  error: string;
}>;

/** Base props shared by single/multi */
type BaseProps<T extends SelectOption> = {
  options?: T[];
  disabled?: boolean;
  clearable?: boolean;
  placeholder?: string;
  // async
  loadOptions?: (query: string) => Promise<T[]>;
  debounceMs?: number;
  // presentation
  classNames?: ClassNames;
  style?: CSSProperties;
  menuPlacement?: "auto" | "bottom" | "top";
  maxMenuHeight?: number;
  // behavior
  isRemoveSelected?: boolean; // hide already-selected options in the menu
  // custom renderers
  renderOption?: (opt: T, active: boolean, selected: boolean) => React.ReactNode;
  renderTag?: (opt: T, onRemove: () => void) => React.ReactNode;
  // portal
  portalTarget?: HTMLElement | null;
  portalId?: string; // element id; defaults to document.body

  // NEW a11y/form bits
  id?: string;
  label?: string | React.ReactNode;
  required?: boolean;
  /** true → red state; ReactNode → red state + message below */
  error?: boolean | React.ReactNode;
};

/** Single-select props */
type SingleProps<T extends SelectOption> = BaseProps<T> & {
  multiple?: false;
  value: T | null;
  onChange: (next: T | null) => void;
};

/** Multi-select props */
type MultiProps<T extends SelectOption> = BaseProps<T> & {
  multiple: true;
  value: T[];
  onChange: (next: T[]) => void;
};

export type SelectProps<T extends SelectOption = SelectOption> =
  | SingleProps<T>
  | MultiProps<T>;

/* ===========================
   Small Portal (inline)
=========================== */
function Portal({
  children,
  target,
  targetId,
}: {
  children: React.ReactNode;
  target?: HTMLElement | null;
  targetId?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setMounted(true);
    if (target) setEl(target);
    else if (targetId) setEl(document.getElementById(targetId));
    else setEl(document.body);
  }, [target, targetId]);
  if (!mounted || !el) return null;
  return createPortal(children, el);
}

/* ===========================
   Utilities
=========================== */
function useDebouncedValue<T>(value: T, ms = 200) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}
function includesOption<T extends SelectOption>(arr: T[], opt: T) {
  return arr.some((o) => o.value === opt.value);
}

/* ===========================
   Select Component
=========================== */
export function Select<T extends SelectOption = SelectOption>(
  props: SelectProps<T>
) {
  const {
    options = [],
    value,
    placeholder = "Select…",
    debounceMs = 250,
    classNames,
    style,
    menuPlacement = "auto",
    maxMenuHeight = 280,
    renderOption,
    renderTag,
    portalTarget,
    portalId,
    loadOptions,
    disabled = false,
    clearable = true,
    isRemoveSelected = false,

    // NEW labeled props
    id,
    label,
    required,
    error,
  } = props;

  const multiple = props.multiple === true;
  const onChangeSingle = !multiple
    ? (props.onChange as (n: T | null) => void)
    : undefined;
  const onChangeMulti = multiple ? (props.onChange as (n: T[]) => void) : undefined;

  const controlRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query, debounceMs);

  const [asyncOptions, setAsyncOptions] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // a11y ids
  const uid = React.useId();
  const inputId = id ?? `select-${uid}`;
  const errorId = `select-err-${uid}`;

  // selected as array (compute early so we can filter options against it)
  const selectedArray: T[] = useMemo(() => {
    return multiple ? ((value as T[]) ?? []) : value ? ([value as T] as T[]) : [];
  }, [value, multiple]);

  // positioning
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    place: "top" | "bottom";
  }>({ top: 0, left: 0, width: 0, place: "bottom" });

  // options (async or local filtered) + hide selected if requested
  const currentOptions: T[] = useMemo(() => {
    const src: T[] = loadOptions
      ? (asyncOptions ?? [])
      : (() => {
          const ql = q.trim().toLowerCase();
          if (!ql) return options;
          return options.filter((o) => o.label.toLowerCase().includes(ql));
        })();

    if (!isRemoveSelected || selectedArray.length === 0) return src;
    return src.filter((o) => !includesOption(selectedArray, o));
  }, [options, asyncOptions, q, loadOptions, isRemoveSelected, selectedArray]);

  // load async options
  useEffect(() => {
    let abort = false;
    if (!loadOptions) return;
    setLoading(true);
    loadOptions(q)
      .then((res) => {
        if (!abort) setAsyncOptions(res);
      })
      .finally(() => {
        if (!abort) setLoading(false);
      });
    return () => {
      abort = true;
    };
  }, [q, loadOptions]);

  const isSelected = (opt: T) => includesOption(selectedArray, opt);

  // measure & position menu (clamp horizontally, flip if needed)
  const measureAndPosition = () => {
    const ctrl = controlRef.current;
    if (!ctrl) return;
    const rect = ctrl.getBoundingClientRect();
    const vw = window.innerWidth;
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;

    const width = rect.width;
    let left = rect.left + scrollX;
    const pad = 8;
    if (left + width > vw - pad) left = vw - width - pad;
    if (left < pad) left = pad;

    const spaceBelow = window.innerHeight - rect.bottom;
    const place: "top" | "bottom" =
      menuPlacement === "top"
        ? "top"
        : menuPlacement === "bottom"
        ? "bottom"
        : spaceBelow >= 180
        ? "bottom"
        : "top";
    const top = place === "bottom" ? rect.bottom + scrollY : rect.top + scrollY;

    setMenuPos({ top, left, width, place });
  };

  useEffect(() => {
    if (!open) return;
    measureAndPosition();
    const onResize = () => measureAndPosition();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedArray.length]);

  // outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const c = controlRef.current;
      const m = menuRef.current;
      if (c?.contains(e.target as Node)) return;
      if (m?.contains(e.target as Node)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // keyboard nav
  const moveActive = (delta: number) => {
    const len = currentOptions.length;
    if (!len) return;
    let next = activeIndex + delta;
    if (next < 0) next = len - 1;
    if (next >= len) next = 0;
    setActiveIndex(next);
    // ensure visible
    const menu = menuRef.current;
    if (!menu) return;
    const opt = menu.querySelector(`[data-index="${next}"]`) as HTMLElement | null;
    if (opt) {
      const top = opt.offsetTop;
      const bottom = top + opt.offsetHeight;
      if (top < menu.scrollTop) menu.scrollTop = top;
      else if (bottom > menu.scrollTop + menu.clientHeight)
        menu.scrollTop = bottom - menu.clientHeight;
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (disabled) return;
    if (
      !open &&
      (e.key === "ArrowDown" || e.key === "Enter" || e.key === " " || e.key === "ArrowUp")
    ) {
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      e.preventDefault();
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      moveActive(1);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      moveActive(-1);
      e.preventDefault();
    } else if (e.key === "Enter") {
      const opt = currentOptions[activeIndex];
      if (opt && !opt.disabled) selectOption(opt as T);
      e.preventDefault();
    } else if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      (controlRef.current?.querySelector("input") as HTMLInputElement | undefined)?.blur();
    } else if (e.key === "Backspace" && multiple && !query) {
      if (selectedArray.length > 0) {
        const next = selectedArray.slice(0, -1);
        onChangeMulti?.(next);
      }
    }
  };

  // select/clear
  const selectOption = (opt: T) => {
    if (multiple) {
      if (isSelected(opt)) {
        onChangeMulti?.(selectedArray.filter((o) => o.value !== opt.value));
      } else {
        onChangeMulti?.([...selectedArray, opt]);
      }
      setQuery("");
      inputRef.current?.focus();
    } else {
      onChangeSingle?.(opt);
      setOpen(false);
      setQuery("");
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (multiple) onChangeMulti?.([]);
    else onChangeSingle?.(null);
    setQuery("");
    inputRef.current?.focus();
  };

  // derived labels
  const selected = !multiple ? selectedArray[0] : undefined;
  const valueLabel = selected?.label;

  // ids for listbox
  const listboxId = useMemo(() => `sel-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div
      className={clsx("relative inline-block w-full", classNames?.container)}
      style={style}
    >
      {/* Label (string or node) */}
      {label &&
        (typeof label === "string" ? (
          <label
            htmlFor={inputId}
            className={clsx(
              "mb-1 block text-sm font-medium",
              error ? "text-red-600" : "text-slate-700",
              classNames?.label
            )}
          >
            {label}
            {required && <span className="ms-0.5 text-red-600">*</span>}
          </label>
        ) : (
          label
        ))}

      {/* Control */}
      <div
        ref={controlRef}
        role="combobox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-haspopup="listbox"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={clsx(
          "relative flex min-h-10 w-full items-center gap-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm",
          "focus-within:border-slate-400 focus-within:ring-2 focus-within:ring-slate-200",
          disabled && "opacity-60 pointer-events-none",
          error && "border-red-500 focus-within:ring-red-200",
          classNames?.control,
          open && classNames?.controlFocused
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
      >
        {/* Value / Tags */}
        {multiple ? (
          <div className="flex flex-1 flex-wrap gap-1">
            {selectedArray.map((opt) =>
              renderTag ? (
                <React.Fragment key={opt.value}>
                  {renderTag(opt, () =>
                    onChangeMulti?.(selectedArray.filter((o) => o.value !== opt.value))
                  )}
                </React.Fragment>
              ) : (
                <span
                  key={opt.value}
                  className={clsx(
                    "inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5",
                    classNames?.tag
                  )}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span>{opt.label}</span>
                  <button
                    type="button"
                    aria-label="Remove"
                    className={clsx(
                      "text-slate-500 hover:text-slate-700",
                      classNames?.tagRemove
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangeMulti?.(
                        selectedArray.filter((o) => o.value !== opt.value)
                      );
                    }}
                  >
                    ×
                  </button>
                </span>
              )
            )}
            <input
              id={inputId}
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
                setActiveIndex(0);
              }}
              className={clsx(
                "min-w-[2ch] flex-1 bg-transparent outline-none",
                classNames?.input
              )}
              placeholder={selectedArray.length ? "" : placeholder}
              aria-invalid={!!error || undefined}
              aria-required={required || undefined}
              aria-describedby={
                typeof error !== "boolean" && error ? errorId : undefined
              }
            />
          </div>
        ) : (
          <>
            <span
              className={clsx(
                "flex-1",
                (open || query) && "sr-only",
                !valueLabel && "text-slate-400",
                classNames?.value
              )}
            >
              {selected ? (
                <span className="inline-flex items-center gap-2 truncate">
                  {selected.icon && <span className="shrink-0">{selected.icon}</span>}
                  <span className="truncate capitalize">{selected.label}</span>
                </span>
              ) : (
                placeholder
              )}
            </span>

            <input
              id={inputId}
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!open) setOpen(true);
                setActiveIndex(0);
              }}
              className={clsx(
                "flex-1 bg-transparent outline-none",
                !open && !query && "absolute left-2 top-2 w-0 opacity-0 pointer-events-none",
                classNames?.input
              )}
              placeholder={!valueLabel ? placeholder : ""}
              aria-invalid={!!error || undefined}
              aria-required={required || undefined}
              aria-describedby={
                typeof error !== "boolean" && error ? errorId : undefined
              }
            />
          </>
        )}

        {/* Clear + Chevron */}
        <div className="ml-auto flex items-center gap-1">
          {clearable &&
            (multiple ? selectedArray.length > 0 : !!selectedArray[0]) && (
              <button
                type="button"
                onClick={clear}
                className={clsx(
                  "rounded p-1 text-slate-400 hover:text-slate-600",
                  classNames?.clear
                )}
                aria-label="Clear"
              >
                ×
              </button>
            )}
          <svg
            className={clsx(
              "h-4 w-4 transition-transform",
              open && "rotate-180",
              classNames?.icon
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
          </svg>
        </div>
      </div>

      {/* Error text (if provided as node/string) */}
      {typeof error !== "boolean" && error && (
        <p id={errorId} className={clsx("mt-1 text-xs text-red-600", classNames?.error)}>
          {error}
        </p>
      )}

      {/* Menu (Portal) */}
      {open && (
        <Portal target={portalTarget} targetId={portalId}>
          <div
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={multiple || undefined}
            style={{
              position: "absolute",
              top: menuPos.place === "bottom" ? menuPos.top : undefined,
              bottom:
                menuPos.place === "top"
                  ? window.innerHeight - menuPos.top
                  : undefined,
              left: menuPos.left,
              width: menuPos.width,
              maxHeight: maxMenuHeight,
              zIndex: 50,
            }}
            className={clsx(
              "overflow-auto rounded-md border border-slate-200 bg-white shadow-lg",
              menuPos.place === "bottom" ? "origin-top" : "origin-bottom",
              "transition-all duration-150",
              classNames?.menu
            )}
          >
            {loading ? (
              <div className="px-3 py-2 text-sm text-slate-500">Loading…</div>
            ) : currentOptions.length === 0 ? (
              <div
                className={clsx(
                  "px-3 py-2 text-sm text-slate-500",
                  classNames?.noOptions
                )}
              >
                No results
              </div>
            ) : (
              currentOptions.map((opt, i) => {
                const active = i === activeIndex;
                const selected = isSelected(opt);
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={selected}
                    data-index={i}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      if (!opt.disabled) selectOption(opt as T);
                    }}
                    className={clsx(
                      "cursor-pointer px-3 py-2 text-sm",
                      active && "bg-slate-100",
                      selected && "font-semibold",
                      opt.disabled && "pointer-events-none opacity-50",
                      classNames?.option,
                      active && classNames?.optionActive,
                      selected && classNames?.optionSelected
                    )}
                  >
                    {renderOption ? (
                      renderOption(opt, active, selected)
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                        <span className="capitalize">{opt.label}</span>
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}
