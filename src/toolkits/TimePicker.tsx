"use client";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * TimePicker – RHF-register friendly + smart flip placement
 * - Works without Controller: spread register(...) on it
 * - Slot panel flips to top if not enough space below and clamps height
 * - Native mode is just <input type="time"> with register props wired directly
 */

export type TimePickerClassNames = {
  root?: string;
  trigger?: string;
  panel?: string;
  option?: string;
  optionSelected?: string;
  optionDisabled?: string;
  icon?: string;
  tag?: string;
  tagRemove?: string;
  clearButton?: string;
  native?: string;
  label?: string;
  searchWrapper?: string;
  search?: string;
  empty?: string;
};

type SharedProps = {
  step?: number;            // minutes (native)
  slotGap?: number;         // minutes between slots (panel mode)
  start?: string;           // "HH:MM"
  end?: string;             // "HH:MM"

  disabledSlots?: Array<number | string>;
  disbaledSlots?: Array<number | string>; // backward compat typo

  disabled?: boolean;
  maxSelections?: number;
  closeOnSelect?: boolean;
  clearable?: boolean;

  isTimeSlot?: boolean;     // panel mode (true) vs native input (false)
  use12Hour?: boolean;
  use24Hour?: boolean;

  searchAble?: boolean;
  searchPlaceholder?: string;

  classNames?: TimePickerClassNames;
  icon?: React.ReactNode;
  error?: string | any;

  // RHF register props
  name?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;

  id?: string;
  placeholder?: string;
  ariaLabel?: string;

  label?: React.ReactNode;
  required?: boolean;

  // App-level callback (use this instead of RHF onChange at the component API level)
  onValueChange?: (value: string | string[] | null) => void;
};

export type TimePickerPropsMulti = SharedProps & {
  multi?: true; // default
  value?: string[];
  defaultValue?: string[];
};
export type TimePickerPropsSingle = SharedProps & {
  multi: false;
  value?: string | null;
  defaultValue?: string | null;
};
export type TimePickerProps = TimePickerPropsMulti | TimePickerPropsSingle;

const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
const toMinutes = (h: number, m: number) => h * 60 + m;
const minutesToTime = (min: number) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
const timeToMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return toMinutes(h, m);
};

const format12h = (t24: string) => {
  const [hh, mm] = t24.split(":").map(Number);
  const am = hh < 12;
  const h12 = hh % 12 || 12;
  return `${h12}:${pad(mm)} ${am ? "AM" : "PM"}`;
};
const formatLabel = (t24: string, mode: "12" | "24") => (mode === "12" ? format12h(t24) : t24);

function parseTimeLoose(input: string): number {
  const s = String(input ?? "").trim();
  if (!s) return 0;
  const parts = s.split(":");
  let h = 0, m = 0;
  if (parts.length === 1) {
    h = Number(parts[0]) || 0;
  } else {
    h = Number(parts[0]) || 0;
    m = Number(parts[1]) || 0;
  }
  h = Math.max(0, Math.min(23, h));
  m = Math.max(0, Math.min(59, m));
  return toMinutes(h, m);
}

const generateSlots = (startMin: number, endMin: number, step: number): string[] => {
  const out: string[] = [];
  const s = Math.max(0, Math.min(1439, startMin));
  const e = Math.max(0, Math.min(1439, endMin));
  for (let t = s; t <= e; t += Math.max(1, step)) out.push(minutesToTime(t));
  if (out.length === 0 || timeToMinutes(out[out.length - 1]) < e) out.push(minutesToTime(e));
  return out;
};

// disabled tokens: "1am", "13", "01:00", "1:15pm"
function parseDisabledToken(tok: string): { hour?: number; time?: string } {
  let s = String(tok).toLowerCase().trim().replace(/\s/g, "");
  let ampm: "am" | "pm" | null = null;
  if (s.endsWith("am")) { ampm = "am"; s = s.slice(0, -2); }
  else if (s.endsWith("pm")) { ampm = "pm"; s = s.slice(0, -2); }
  let h = 0; let m: number | undefined;
  const parts = s.split(":");
  if (parts.length === 1) {
    h = Number(parts[0]); if (Number.isNaN(h)) return {};
  } else if (parts.length === 2) {
    h = Number(parts[0]); m = Number(parts[1]);
    if (Number.isNaN(h) || Number.isNaN(m)) return {};
  } else return {};
  if (ampm) h = (h % 12) + (ampm === "pm" ? 12 : 0);
  if (m == null) return h >= 0 && h <= 23 ? { hour: h } : {};
  m = Math.max(0, Math.min(59, m));
  return { time: `${pad(h)}:${pad(m)}` };
}
function parseDisabledList(a?: Array<number | string>, b?: Array<number | string>) {
  const hours = new Set<number>();
  const exactTimes = new Set<string>();
  const list = [...(a ?? []), ...(b ?? [])];
  for (const item of list) {
    if (typeof item === "number") {
      if (item >= 0 && item <= 23) hours.add(item);
      continue;
    }
    const res = parseDisabledToken(item);
    if (res.time) exactTimes.add(res.time);
    else if (res.hour != null) hours.add(res.hour);
  }
  return { hours, exactTimes };
}

function useOutsideClick<T extends HTMLElement>(active: boolean, onAway: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!active) return;
    const handler = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onAway();
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [active, onAway]);
  return ref;
}

const DefaultIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5">
    <path
      fill="currentColor"
      d="M12 1a11 11 0 1 0 0 22 11 11 0 0 0 0-22zm0 2a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm1 4a1 1 0 0 0-2 0v6c0 .265.105.52.293.707l3.5 3.5a1 1 0 1 0 1.414-1.414L13 12.586V7z"
    />
  </svg>
);

const arraysEqualUnordered = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  for (const v of b) if (!set.has(v)) return false;
  return true;
};

const TimePickerImpl = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(props, ref) {
  const {
    step = 30,
    slotGap,
    start = "00:00",
    end = "23:30",
    disabledSlots = [],
    disbaledSlots,
    disabled = false,
    classNames,
    icon,
    name,
    id,
    placeholder = "Select time(s)",
    ariaLabel,
    closeOnSelect,
    maxSelections,
    clearable = false,
    isTimeSlot = false,
    use12Hour = true,
    use24Hour = false,
    label,
    required,
    error,
    searchAble = false,
    searchPlaceholder = "Search time…",

    // RHF register handlers (if using register)
    onChange: rhfOnChange,
    onBlur: rhfOnBlur,

    // App-level callback
    onValueChange,
  } = props;

  const isSingle = props.multi === false;
  const multi = !isSingle;

  // controlled props
  const controlledValue = (props as any).value as string | string[] | null | undefined;
  const defaultValue = (props as any).defaultValue as string | string[] | null | undefined;
  const appOnChange = (props as any).onChange as ((v: string | null) => void) | ((v: string[]) => void) | undefined;

  const uid = useId();
  const listboxId = `${id ?? uid}-listbox`;
  const buttonId = `${id ?? uid}-button`;
  const inputId = id ?? `${uid}-time`;
  const labelId = `${inputId}-label`;
  const IconEl = icon ?? <DefaultIcon />;

  const effectiveStep = slotGap ?? step;

  // slots
  const startMin = useMemo(() => parseTimeLoose(start), [start]);
  const endMin = useMemo(() => parseTimeLoose(end), [end]);
  const slots = useMemo(
    () => generateSlots(startMin, endMin, Math.max(1, effectiveStep)),
    [startMin, endMin, effectiveStep]
  );

  // disabled
  const disabledParsed = useMemo(
    () => parseDisabledList(disbaledSlots, disabledSlots),
    [disbaledSlots, disabledSlots]
  );
  const disabledTimes = useMemo(() => {
    const s = new Set<string>();
    for (const t of slots) {
      const hour = Number(t.slice(0, 2));
      if (disabledParsed.hours.has(hour) || disabledParsed.exactTimes.has(t)) s.add(t);
    }
    return s;
  }, [slots, disabledParsed]);

  // selected state (internal array even for single)
  const isControlled = controlledValue !== undefined;
  const [internal, setInternal] = useState<string[]>(() => {
    if (isSingle) {
      const dv = defaultValue as string | null | undefined;
      return dv ? [dv] : [];
    }
    return (defaultValue as string[] | undefined) ?? [];
  });

  const selected: string[] = useMemo(() => {
    if (!isControlled) return internal;
    if (isSingle) {
      const v = controlledValue as string | null | undefined;
      return v ? [v] : [];
    }
    return (controlledValue as string[] | undefined) ?? [];
  }, [isControlled, controlledValue, internal, isSingle]);

  // notify app + RHF
  const serialize = useCallback(
    (vals: string[]) => (multi ? vals.join(",") : (vals[0] ?? "")),
    [multi]
  );

  const emitChange = useCallback(
    (next: string[]) => {
      // app-level onChange / onValueChange
      if (appOnChange) {
        if (isSingle) (appOnChange as (v: string | null) => void)(next[0] ?? null);
        else (appOnChange as (v: string[]) => void)(next);
      }
      onValueChange?.(multi ? next : next[0] ?? null);

      // RHF register onChange (if present)
      if (typeof rhfOnChange === "function" && name) {
        rhfOnChange({
          target: { value: serialize(next), name },
          type: "change",
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    },
    [appOnChange, onValueChange, rhfOnChange, name, serialize, isSingle, multi]
  );

  const setSelected = useCallback(
    (next: string[]) => {
      if (!isControlled) setInternal((prev) => (arraysEqualUnordered(prev, next) ? prev : next));
      emitChange(next);
    },
    [isControlled, emitChange]
  );

  // UI state for slot panel
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<number>(-1);
  const [query, setQuery] = useState("");

  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const searchRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (!open) return;
    if (searchAble) setTimeout(() => searchRef.current?.focus(), 0);
    setHighlighted(0);
  }, [open, searchAble]);

  const labels24 = useMemo(() => slots.map((t) => t), [slots]);
  const labels12 = useMemo(() => slots.map((t) => format12h(t).toLowerCase()), [slots]);

  const filteredSlots = useMemo(() => {
    if (!query) return slots;
    const q = query.toLowerCase().replace(/\s/g, "");
    const out: string[] = [];
    for (let i = 0; i < slots.length; i++) {
      const t = labels24[i];
      if (t.includes(q) || labels12[i].replace(/\s/g, "").includes(q)) out.push(t);
    }
    return out;
  }, [query, slots, labels12, labels24]);

  useEffect(() => setHighlighted(0), [query]);

  useEffect(() => {
    if (!open) return;
    if (selected.length) {
      const idx = filteredSlots.findIndex((t) => t === selected[0]);
      setHighlighted(idx >= 0 ? idx : 0);
    } else {
      setHighlighted(0);
    }
  }, [open, selected, filteredSlots]);

  const displayMode: "12" | "24" = use12Hour ? "12" : "24";
  const forcedMode: "12" | "24" = use24Hour && !use12Hour ? "24" : displayMode;

  const summary = useMemo(
    () => (selected.length ? selected.map((t) => formatLabel(t, forcedMode)).join(", ") : ""),
    [selected, forcedMode]
  );

  const shouldCloseOnSelect = (props.closeOnSelect ?? !multi) && !multi;

  const toggleTime = useCallback(
    (t: string) => {
      if (disabledTimes.has(t)) return;
      const exists = selected.includes(t);
      let next: string[];
      if (multi) {
        if (exists) next = selected.filter((v) => v !== t);
        else {
          if (props.maxSelections && selected.length >= props.maxSelections) return;
          next = [...selected, t];
        }
      } else {
        next = exists ? [] : [t];
      }
      if (shouldCloseOnSelect) setOpen(false);
      setSelected(next);
    },
    [disabledTimes, selected, multi, props.maxSelections, shouldCloseOnSelect, setSelected]
  );

  const clearAll = useCallback(() => setSelected([]), [setSelected]);

  // keyboard (slot mode)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!open) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        return;
      }
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((i) => Math.min(filteredSlots.length - 1, i + 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((i) => Math.max(0, i - 1)); }
      else if (e.key === "Home") { e.preventDefault(); setHighlighted(0); }
      else if (e.key === "End") { e.preventDefault(); setHighlighted(filteredSlots.length - 1); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (highlighted >= 0 && highlighted < filteredSlots.length) toggleTime(filteredSlots[highlighted]);
      }
    },
    [open, filteredSlots, highlighted, toggleTime]
  );

  // ---------- SMART FLIP for slot panel ----------
  type Placement = "bottom" | "top";
  const [placement, setPlacement] = useState<Placement>("bottom");
  const [maxHeight, setMaxHeight] = useState<number | undefined>(undefined);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const compute = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const spaceBelow = Math.max(0, viewportH - rect.bottom);
      const spaceAbove = Math.max(0, rect.top);
      const desired = 360; // expected panel height (guess)
      const nextPlacement: Placement =
        spaceBelow >= desired || spaceBelow >= spaceAbove ? "bottom" : "top";
      setPlacement(nextPlacement);
      const padding = 8;
      const available = (nextPlacement === "bottom" ? spaceBelow : spaceAbove) - padding;
      setMaxHeight(Math.max(200, available));
    };

    requestAnimationFrame(compute);
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    const ro = new ResizeObserver(compute);
    if (anchorRef.current) ro.observe(anchorRef.current);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
      ro.disconnect();
    };
  }, [open]);
  // -----------------------------------------------

  // --------- NATIVE MODE (no panel, just input) ----------
  if (!isTimeSlot) {
    const nativeValue = selected[0] ?? "";
    const nativeStepSec = Math.max(1, step) * 60;
    const nativeMin = minutesToTime(startMin);
    const nativeMax = minutesToTime(endMin);

    const onNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      if (!v) { setSelected([]); return; }
      const hour = Number(v.slice(0, 2));
      if (disabledParsed.hours.has(hour) || disabledParsed.exactTimes.has(v)) {
        e.preventDefault();
        e.target.value = nativeValue;
        return;
      }
      setSelected([v]);
    };

    return (
      <div className={`inline-block w-full ${classNames?.root ?? ""}`}>
        {label && (
          <label
            id={labelId}
            htmlFor={inputId}
            className={classNames?.label ?? "mb-1 block text-sm font-medium text-slate-700"}
          >
            {label}{required && <span className="ml-0.5 text-rose-600">*</span>}
          </label>
        )}

        <div className="relative">
          {/* In native mode we wire register props directly to the real input */}
          <input
            id={inputId}
            name={name}
            type="time"
            step={nativeStepSec}
            min={nativeMin}
            max={nativeMax}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={label ? `${labelId} ${inputId}` : undefined}
            value={nativeValue}
            onChange={onNativeChange}
            onBlur={rhfOnBlur}
            // IMPORTANT: forward the ref so RHF gets it when using register
            ref={ref}
            className={`w-full rounded-md text-sm placeholder-slate-400 outline-none transition h-10 px-3.5 border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 ${classNames?.native ?? ""}`}
          />

          {!nativeValue && placeholder && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              {placeholder}
            </span>
          )}

          {clearable && nativeValue && (
            <button
              type="button"
              onClick={() => setSelected([])}
              aria-label="Clear selection"
              className={`absolute right-8 top-1/2 h-8 w-8 text-slate-500 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100 ${classNames?.clearButton ?? ""}`}
            >
              <span aria-hidden className="inline-flex select-none text-current">✕</span>
            </button>
          )}

          <button
            type="button"
            aria-label="Open native picker"
            onClick={() => (document.getElementById(inputId) as HTMLInputElement | null)?.showPicker?.()}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-100 ${classNames?.icon ?? ""}`}
          >
            {IconEl}
          </button>
        </div>

        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>
    );
  }
  // --------- SLOT PANEL MODE (flip + hidden input for RHF) ----------

  const display = useMemo(
    () => (selected.length ? selected.map((t) => formatLabel(t, forcedMode)).join(", ") : ""),
    [selected, forcedMode]
  );

  return (
    <div ref={rootRef} className={`inline-block w-full ${classNames?.root ?? ""}`}>
      {label && (
        <label
          id={labelId}
          htmlFor={buttonId}
          className={classNames?.label ?? "mb-1 block text-sm font-medium text-slate-700"}
        >
          {label}{required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}

      <div ref={anchorRef} className="relative">
        <button
          id={buttonId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-label={ariaLabel}
          aria-labelledby={label ? `${labelId} ${buttonId}` : undefined}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          className={`flex w-full min-w-[14rem] items-center rounded-md text-sm placeholder-slate-400 outline-none transition h-10 px-3.5 border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 ${classNames?.trigger ?? ""}`}
        >
          <span className={`flex-1 truncate text-start ${display ? "" : "text-slate-400"}`}>
            {display || placeholder}
          </span>
          <span className="sr-only">Toggle time picker</span>
        </button>

        {clearable && display && (
          <button
            type="button"
            onClick={() => setSelected([])}
            aria-label="Clear selection"
            className={`absolute right-8 top-1/2 h-8 w-8 text-slate-500 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100 ${classNames?.clearButton ?? ""}`}
          >
            <span aria-hidden className="inline-flex select-none text-current">✕</span>
          </button>
        )}

        <button
          type="button"
          aria-label="Toggle time panel"
          onClick={() => setOpen((o) => !o)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-gray-100 ${classNames?.icon ?? ""}`}
        >
          {IconEl}
        </button>

        {/* Single hidden input for RHF register (CSV for multi) */}
        {name && (
          <input
            ref={ref}
            type="hidden"
            name={name}
            value={serialize(selected)}
            onBlur={rhfOnBlur}
            aria-hidden
            readOnly
          />
        )}

        {open && (
          <div
            role="presentation"
            className={`absolute z-50 ${placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"} w-full min-w-[14rem] rounded-2xl border bg-white p-1 shadow-lg ${classNames?.panel ?? ""}`}
            onKeyDown={onKeyDown}
            style={{ maxHeight, overflow: "auto" }}
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-1">
              <div className="text-sm text-gray-600">{multi ? "Select times" : "Select a time"}</div>
              <button
                type="button"
                className={`text-xs underline ${classNames?.clearButton ?? ""}`}
                onClick={() => setSelected([])}
                aria-label="Clear all selections"
              >
                Clear
              </button>
            </div>

            {searchAble && (
              <div className={`mb-2 px-1 ${classNames?.searchWrapper ?? ""}`}>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder ?? "Search time…"}
                  aria-label="Search time slots"
                  className={`w-full cursor-pointer rounded-md text-sm placeholder-slate-400 outline-none transition h-10 px-3.5 border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400 ${classNames?.search ?? ""}`}
                />
              </div>
            )}

            <ul
              id={listboxId}
              role="listbox"
              aria-labelledby={buttonId}
              aria-multiselectable={multi || undefined}
              className="outline-none"
              tabIndex={-1}
            >
              {filteredSlots.length === 0 && (
                <li className={`px-3 py-2 text-sm text-gray-500 ${classNames?.empty ?? ""}`}>No matching times</li>
              )}
              {filteredSlots.map((t, i) => {
                const isDisabled = disabledTimes.has(t);
                const isSelected = selected.includes(t);
                const isActive = i === highlighted;
                const labelTxt = formatLabel(t, forcedMode);
                return (
                  <li
                    key={t}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={isDisabled}
                    data-time={t}
                    onMouseEnter={() => setHighlighted(i)}
                    onClick={() => !isDisabled && toggleTime(t)}
                    className={`cursor-pointer select-none rounded-2xl px-3 py-2 text-sm transition outline-none
                      ${isDisabled ? `pointer-events-none opacity-40 ${classNames?.optionDisabled ?? ""}` : ""}
                      ${!isDisabled && isActive ? "bg-gray-100" : ""}
                      ${classNames?.option ?? ""}`}
                  >
                    <span className={isSelected ? classNames?.optionSelected ?? "font-semibold" : undefined}>
                      {labelTxt}
                    </span>
                  </li>
                );
              })}
            </ul>

            {selected.length > 0 && multi && (
              <div className="mt-2 flex flex-wrap gap-2 px-1 pb-1">
                {selected.map((t) => (
                  <span
                    key={t}
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${classNames?.tag ?? ""}`}
                  >
                    {formatLabel(t, forcedMode)}
                    <button
                      type="button"
                      aria-label={`Remove ${t}`}
                      onClick={() => toggleTime(t)}
                      className={`rounded-full p-0.5 hover:bg-gray-100 ${classNames?.tagRemove ?? ""}`}
                    >
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                        <path
                          fill="currentColor"
                          d="M14.348 5.652a1 1 0 0 0-1.414-1.414L10 7.172 7.066 4.238A1 1 0 1 0 5.652 5.652L8.586 8.586l-2.934 2.934a1 1 0 1 0 1.414 1.414L10 10l2.934 2.934a1 1 0 0 0 1.414-1.414L11.414 8.586l2.934-2.934z"
                        />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
    </div>
  );
});

TimePickerImpl.displayName = "TimePicker";
export const TimePicker = React.memo(TimePickerImpl);
export default TimePicker;
