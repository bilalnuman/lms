"use client";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { CgChevronDown } from "react-icons/cg";
import { FaTimes } from "react-icons/fa";
import { HiHome } from "react-icons/hi2";

/**
 * Option type
 */
export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

/** Lightweight debounce */
function useDebounced<T>(value: T, delay = 150) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/** Props */
export type SelectManuProps = {
  options: Option[];
  /** Multi-select. Defaults to true. */
  multiple?: boolean;
  /** Controlled value(s) */
  value?: string | string[];
  /** Uncontrolled initial value(s) */
  defaultValue?: string | string[];
  /**
   * onChange: when multiple=true → (string[], Option[])
   *            when multiple=false → (string, Option)
   */
  onChange?: (val: string | string[], selected: Option | Option[] | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Only enforced when multiple=true */
  maxSelected?: number;
  searchable?: boolean;
  className?: string;
  renderOption?: (opt: Option, isActive: boolean) => React.ReactNode;
};

/** Utility */
const toArray = (v?: string | string[]): string[] => (Array.isArray(v) ? v : v ? [v] : []);

/**
 * Clean, compile-safe SelectManu with optional multi-select and search.
 * - No external deps
 * - Keeps dropdown open for multi-select until outside click (as requested)
 */
export default function SelectManu({
  options,
  multiple = false,
  value,
  defaultValue,
  onChange,
  placeholder = "Select",
  disabled = false,
  maxSelected,
  searchable = true,
  className = "",
  renderOption,
}: SelectManuProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string[]>(toArray(defaultValue));
  const rawSelected = isControlled ? toArray(value) : internal;
  const selectedValues = multiple ? rawSelected : rawSelected.slice(-1);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const q = useDebounced(query, 120);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Derived
  const mapByValue = useMemo(() => {
    const m = new Map<string, Option>();
    for (const o of options) m.set(o.value, o);
    return m;
  }, [options]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);

  const baseChoices = useMemo(() => {
    if (multiple) return options.filter((o) => !selectedSet.has(o.value));
    return options; // single: show all
  }, [options, selectedSet, multiple]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return baseChoices;
    return baseChoices.filter(
      (o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s)
    );
  }, [baseChoices, q]);

  const selectedOptions = useMemo(
    () => selectedValues.map((v) => mapByValue.get(v)).filter(Boolean) as Option[],
    [selectedValues, mapByValue]
  );

  // Commit helpers
  const emitChange = useCallback(
    (next: string[]) => {
      const normalized = multiple ? next : next.slice(-1);
      if (!isControlled) setInternal(normalized);
      if (onChange) {
        const opts = normalized.map((v) => mapByValue.get(v)).filter(Boolean) as Option[];
        (onChange as any)(multiple ? normalized : normalized[0] ?? "", multiple ? opts : opts[0]);
      }
    },
    [isControlled, onChange, mapByValue, multiple]
  );

  const select = useCallback(
    (val: string) => {
      if (!multiple && selectedValues[0] === val) {
        setOpen(false);
        return;
      }
      if (selectedSet.has(val) && multiple) return;
      if (maxSelected && multiple && selectedValues.length >= maxSelected) return;

      const next = multiple
        ? [...selectedValues.filter((v) => v !== val), val]
        : [val];
      emitChange(next);
      setQuery("");
      setActiveIndex(-1);
      if (multiple) setTimeout(() => inputRef.current?.focus(), 0);
      else setOpen(false);
    },
    [multiple, selectedValues, selectedSet, maxSelected, emitChange]
  );

  const remove = useCallback(
    (val: string) => emitChange(selectedValues.filter((v) => v !== val)),
    [emitChange, selectedValues]
  );

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent | globalThis.MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && wrapperRef.current.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Keyboard
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    switch (e.key) {
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Enter":
        if (open && activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault();
          select(filtered[activeIndex].value);
        }
        break;
      case "Backspace":
        if (!query && selectedValues.length && multiple) {
          e.preventDefault();
          remove(selectedValues[selectedValues.length - 1]);
        }
        break;
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative ${className}`}
      role="combobox"
      aria-expanded={open}
      aria-haspopup="listbox"
      onKeyDown={onKeyDown}
    >
      {/* Trigger */}
      <div
        className={`flex items-center justify-between relative border border-neutral-200 w-full ps-2 rounded-md ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } overflow-hidden`}
        role="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        tabIndex={0}
      >
        <div className="flex items-center gap-2 overflow-x-auto flex-1 h-10">
          {selectedOptions.length ? (
            multiple ? (
              selectedOptions.map((opt) => (
                <div
                  key={opt.value}
                  className="text-sm bg-gray-100 px-2 py-0.5 rounded relative min-w-fit flex items-center gap-1"
                >
                  <span className="text-neutral-500">{opt.icon ?? <HiHome />}</span>
                  <span>{opt.label}</span>
                  <button
                    aria-label={`Remove ${opt.label}`}
                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                      e.stopPropagation();
                      remove(opt.value);
                    }}
                    className="-me-1"
                  >
                    <FaTimes className="text-xs bg-red-500 rounded-full text-white p-[2px]" />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-sm bg-gray-100 px-2 py-0.5 rounded relative min-w-fit flex items-center gap-1">
                <span className="text-neutral-500">{selectedOptions[0].icon ?? <HiHome />}</span>
                <span>{selectedOptions[0].label}</span>
                <button
                  aria-label={`Clear ${selectedOptions[0].label}`}
                  onClick={(e: MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    emitChange([]);
                  }}
                  className="-me-1"
                >
                  <FaTimes className="text-xs bg-red-500 rounded-full text-white p-[2px]" />
                </button>
              </div>
            )
          ) : (
            <span className="text-neutral-500 text-sm">{placeholder}</span>
          )}
        </div>
        <button
          type="button"
          tabIndex={-1}
          className={`px-2 ${open ? "-rotate-180" : ""} transition-transform duration-300 ease-in-out`}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <CgChevronDown />
        </button>
      </div>

      {/* Popup */}
      {open && (
        <div
          role="listbox"
          aria-multiselectable={multiple || undefined}
          className="flex flex-col items-start w-full border absolute z-50 bg-white shadow-md mt-1 rounded-md overflow-hidden"
        >
          {searchable && (
            <input
              ref={inputRef}
              type="search"
              placeholder="Search..."
              className="w-full outline-none px-3 py-2 border-b"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              autoFocus
            />
          )}

          {filtered.length === 0 ? (
            <p className="text-center w-full py-4 text-xs">No results found.</p>
          ) : (
            <div className="max-h-64 overflow-auto w-full">
              {filtered.map((opt, idx) => {
                const isActive = idx === activeIndex;
                const isSelected = !multiple && selectedSet.has(opt.value);
                return (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={isActive || isSelected}
                    className={`flex items-center px-3 gap-2 justify-between w-full ${
                      isActive || isSelected ? "bg-neutral-200" : idx % 2 === 0 ? "bg-neutral-50" : "bg-white"
                    }`}
                  >
                    <button
                      type="button"
                      className="flex items-center py-2 flex-1 gap-2 text-left"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => select(opt.value)}
                    >
                      <span>{opt.icon ?? <HiHome />}</span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                    <span className="opacity-60">{opt.icon ?? <HiHome />}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * --- Minimal demo (remove in prod) ---
 */

