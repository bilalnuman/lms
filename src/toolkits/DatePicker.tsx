import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const clamp = (d: Date, min?: Date, max?: Date) => {
  let x = d;
  if (min && d < min) x = min;
  if (max && d > max) x = max;
  return x;
};
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function getMonthGrid(base: Date, weekStartsOn: number = 0): Date[] {
  const first = startOfMonth(base);
  const padStart = (first.getDay() - weekStartsOn + 7) % 7;
  const totalDays = 42;
  const start = new Date(first);
  start.setDate(first.getDate() - padStart);
  return Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function useOutsideClick<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      const target = e.target as Node;
      if (!ref.current.contains(target)) onOutside();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onOutside]);
  return ref;
}

export type DatePickerClassNames = {
  root?: string;
  input?: string;
  popover?: string;
  header?: string;
  navButton?: string;
  calendar?: string;
  weekRow?: string;
  day?: string;
  dayOutside?: string;
  dayToday?: string;
  daySelected?: string;
  dayDisabled?: string;
  footer?: string;
  time?: string;
  clearButton?: string;
};

export type DatePickerIcons = {
  calendar?: React.ReactNode;
  clock?: React.ReactNode;
  prev?: React.ReactNode;
  next?: React.ReactNode;
  clear?: React.ReactNode;
};

export type DisabledDatesProp = Array<Date | string | number> | ((date: Date) => boolean);

export interface DatePickerProps {
  name?: string;
  value?: Date | Date[] | null;
  defaultValue?: Date | Date[] | null;
  onChange?: (value: Date | Date[] | null) => void;
  multiple?: boolean;
  isDateTime?: boolean;
  use12Hour?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  format?: string;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;

  disablePast?: boolean;
  disableFuture?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: DisabledDatesProp;
  classNames?: DatePickerClassNames;
  icons?: DatePickerIcons;
  error?: string,

  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
const DefaultIcon = ({ children }: { children: string }) => (
  <span aria-hidden className="inline-flex select-none text-current">{children}</span>
);

function formatDisplay(dates: Date | Date[] | null | undefined, fmt?: string, hour12?: boolean) {
  if (!dates) return "";
  const format = (d: Date) => {
    if (fmt) return customFormat(d, fmt);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: d.getHours() || d.getMinutes() ? "2-digit" : undefined,
      minute: d.getHours() || d.getMinutes() ? "2-digit" : undefined,
      hour12: hour12 === true ? true : undefined,
    });
  };
  return Array.isArray(dates) ? dates.map(format).join(", ") : format(dates);
}
function customFormat(d: Date, fmt: string) {
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    DD: String(d.getDate()).padStart(2, "0"),
    HH: String(d.getHours()).padStart(2, "0"),
    mm: String(d.getMinutes()).padStart(2, "0"),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm/g, (m) => map[m]);
}

function normalizeDisabledPredicate(disabledDates?: DisabledDatesProp) {
  if (!disabledDates) return () => false;
  if (typeof disabledDates === "function") return disabledDates;
  const arr = disabledDates;
  return (date: Date) => {
    for (const it of arr) {
      if (it instanceof Date) {
        if (isSameDay(it, date)) return true;
      } else if (typeof it === "string") {
        if (toISODate(date) === it) return true;
      } else if (typeof it === "number") {
        if (date.getDate() === it) return true;
      }
    }
    return false;
  };
}

const DatePickerImpl = forwardRef<HTMLInputElement, DatePickerProps>(function DatePickerImpl(
  {
    name,
    value,
    defaultValue = null,
    onChange,
    multiple = false,
    isDateTime = false,
    use12Hour = false,
    disabled = false,
    readOnly = false,
    placeholder = "Select date",
    format,
    weekStartsOn = 0,
    disablePast = false,
    disableFuture = false,
    minDate,
    maxDate,
    disabledDates,
    classNames,
    icons,
    open,
    error,
    onOpenChange,
  },
  ref
) {
  const id = useId();
  const today = useMemo(() => startOfDay(new Date()), []);

  const inControlled = value !== undefined;
  const [internal, setInternal] = useState<Date | Date[] | null>(defaultValue);
  const selected = inControlled ? value ?? null : internal;

  const [month, setMonth] = useState<Date>(() => {
    const seed = Array.isArray(selected) ? selected[0] : selected || new Date();
    return startOfMonth(seed);
  });

  const [isOpen, setIsOpen] = useState<boolean>(!!open);
  useEffect(() => {
    if (open === undefined) return;
    setIsOpen(open);
  }, [open]);
  const setOpen = useCallback(
    (v: boolean) => {
      if (onOpenChange) onOpenChange(v);
      if (open === undefined) setIsOpen(v);
    },
    [onOpenChange, open]
  );
  const min = useMemo(() => (disablePast ? startOfDay(new Date()) : minDate), [disablePast, minDate]);
  const max = useMemo(() => (disableFuture ? endOfDay(new Date()) : maxDate), [disableFuture, maxDate]);
  const isOutsideRange = useCallback(
    (d: Date) => (min && d < startOfDay(min)) || (max && d > endOfDay(max!)),
    [min, max]
  );
  const disabledPred = useMemo(() => normalizeDisabledPredicate(disabledDates), [disabledDates]);
  const isDisabled = useCallback(
    (d: Date) => isOutsideRange(d) || disabledPred(d),
    [isOutsideRange, disabledPred]
  );

  const displayValue = useMemo(() => formatDisplay(selected, format, isDateTime && use12Hour ? true : undefined), [selected, format, isDateTime, use12Hour]);

  const commit = useCallback(
    (next: Date | Date[] | null) => {
      if (!inControlled) setInternal(next);
      onChange?.(next);
    },
    [inControlled, onChange]
  );

  const toggleDate = useCallback(
    (d: Date) => {
      if (isDisabled(d)) return;
      if (multiple) {
        const arr = Array.isArray(selected) ? [...selected] : selected ? [selected] : [];
        const idx = arr.findIndex((x) => isSameDay(x, d));
        if (idx >= 0) arr.splice(idx, 1);
        else arr.push(clamp(d, min, max));
        commit(arr.length ? arr : null);
      } else {
        const next = selected && !Array.isArray(selected) && isSameDay(selected, d) ? null : clamp(d, min, max);
        commit(next);
        if (!isDateTime) setOpen(false);
      }
    },
    [selected, multiple, isDisabled, commit, min, max, isDateTime, setOpen]
  );

  const setTime = useCallback(
    (h: number, m: number) => {
      if (multiple) return;
      const base = Array.isArray(selected) ? selected[0] : selected;
      if (!base) return;
      const next = new Date(base);
      next.setHours(h, m, 0, 0);
      commit(next);
    },
    [selected, commit, multiple]
  );
  const onInputClick = () => {
    if (disabled || readOnly) return;
    setOpen(!isOpen);
  };

  const popoverRef = useOutsideClick<HTMLDivElement>(() => setOpen(false));
  const [focused, setFocused] = useState<Date | null>(null);
  useEffect(() => {
    if (isOpen && !focused) setFocused(Array.isArray(selected) ? selected[0] ?? new Date() : selected ?? new Date());
  }, [isOpen, selected, focused]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
  };

  const onGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!focused) return;
    let next = new Date(focused);
    switch (e.key) {
      case "ArrowUp":
        next.setDate(focused.getDate() - 7);
        break;
      case "ArrowDown":
        next.setDate(focused.getDate() + 7);
        break;
      case "ArrowLeft":
        next.setDate(focused.getDate() - 1);
        break;
      case "ArrowRight":
        next.setDate(focused.getDate() + 1);
        break;
      case "Home":
        next = startOfMonth(month);
        break;
      case "End":
        next = new Date(month.getFullYear(), month.getMonth(), daysInMonth(month.getFullYear(), month.getMonth()));
        break;
      case "PageUp":
        next = addMonths(month, -1);
        break;
      case "PageDown":
        next = addMonths(month, +1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        toggleDate(focused);
        return;
      case "Escape":
        setOpen(false);
        return;
      default:
        return;
    }
    e.preventDefault();
    setMonth(startOfMonth(next));
    setFocused(next);
  };

  const weekdays = useMemo(() => {
    const base = new Date(2021, 7, 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + ((i + weekStartsOn) % 7));
      return d.toLocaleDateString(undefined, { weekday: "short" });
    });
  }, [weekStartsOn]);

  const grid = useMemo(() => getMonthGrid(month, weekStartsOn), [month, weekStartsOn]);
  const hiddenValue = useMemo(() => {
    if (!selected) return "";
    const serialize = (d: Date) => d.toISOString();
    return Array.isArray(selected) ? selected.map(serialize).join(",") : serialize(selected);
  }, [selected]);

  const cn = (slot: keyof DatePickerClassNames, fallback: string) => [fallback, classNames?.[slot]].filter(Boolean).join(" ");

  const PrevIcon = icons?.prev ?? <DefaultIcon>{"‹"}</DefaultIcon>;
  const NextIcon = icons?.next ?? <DefaultIcon>{"›"}</DefaultIcon>;
  const CalIcon = icons?.calendar ?? <DefaultIcon>{"📅"}</DefaultIcon>;
  const ClockIcon = icons?.clock ?? <DefaultIcon>{"🕒"}</DefaultIcon>;
  const ClearIcon = icons?.clear ?? <DefaultIcon>{"✕"}</DefaultIcon>;

  const monthLabel = useMemo(
    () => month.toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [month]
  );

  return (
    <div className={cn("root", "relative inline-flex w-full")}>
      <div className="w-full">
        <div className="relative flex-1">
          <input
            ref={ref}
            name={name}
            value={displayValue}
            onKeyDown={onKeyDown}
            onClick={onInputClick}
            readOnly
            disabled={disabled}
            placeholder={placeholder}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            className={cn(
              "input",
              "w-full cursor-pointer rounded-md text-sm placeholder-slate-400 outline-none transition h-10 px-3.5 border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
            )}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">{CalIcon}</span>
          {!!selected && !readOnly && (
            <button
              type="button"
              aria-label="Clear selection"
              onClick={(e) => {
                e.stopPropagation();
                commit(null);
              }}
              className={cn(
                "clearButton",
                "absolute right-10 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
              )}
            >
              {ClearIcon}
            </button>
          )}
          {name && <input type="hidden" name={`${name}__raw`} value={hiddenValue} />}
        </div>
        <p className="text-red-600 text-xs">{error}</p>
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-label`}
          onKeyDown={onGridKeyDown}
          className={cn(
            "popover",
            "absolute z-50 mt-2 w-[22rem] rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
          )}
        >
          <div className={cn("header", "mb-2 flex items-center justify-between")}>
            <button
              type="button"
              className={cn(
                "navButton",
                "rounded p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              )}
              onClick={() => setMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              {PrevIcon}
            </button>
            <div id={`${id}-label`} className="select-none text-sm font-semibold">
              {monthLabel}
            </div>
            <button
              type="button"
              className={cn(
                "navButton",
                "rounded p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              )}
              onClick={() => setMonth((m) => addMonths(m, +1))}
              aria-label="Next month"
            >
              {NextIcon}
            </button>
          </div>

          <div className={cn("calendar", "select-none")}>
            <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
              {weekdays.map((w) => (
                <div key={w}>{w}</div>
              ))}
            </div>
            <div role="grid" aria-label="Calendar" className="grid grid-cols-7 gap-1">
              {grid.map((d) => {
                const outside = d.getMonth() !== month.getMonth();
                const disabledCell = isDisabled(d);
                const selectedArr = Array.isArray(selected) ? selected : selected ? [selected] : [];
                const isSelected = selectedArr.some((x) => isSameDay(x, d));
                const isToday = isSameDay(d, today);
                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    role="gridcell"
                    aria-selected={isSelected}
                    disabled={disabledCell}
                    onClick={() => toggleDate(d)}
                    onMouseEnter={() => setFocused(d)}
                    className={cn(
                      "day",
                      [
                        "h-9 w-9 rounded-md text-sm leading-9",
                        "focus:outline-none focus:ring-2 focus:ring-indigo-500",
                        "transition-colors",
                        outside ? "text-slate-400" : "text-slate-800",
                        isSelected && "bg-indigo-600 text-white hover:bg-indigo-600",
                        !isSelected && !disabledCell && "hover:bg-slate-100",
                        disabledCell && "cursor-not-allowed text-slate-300",
                        isToday && !isSelected && "ring-1 ring-indigo-500",
                      ].join(" ")
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
          {isDateTime && !multiple && (
            <div className={cn("time", "mt-3 flex items-center justify-between rounded-lg bg-slate-50 p-2")}
              aria-label="Time selection">
              <div className="flex items-center gap-2 text-slate-700">
                <span>{ClockIcon}</span>
                <span className="text-sm font-medium">Time</span>
              </div>
              <div className="flex items-center gap-2">
                {use12Hour ? (
                  <>
                    <select
                      aria-label="Hours"
                      className="rounded border border-slate-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={(() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        const h24 = s ? s.getHours() : 0;
                        const h12 = h24 % 12 || 12;
                        return h12;
                      })()}
                      onChange={(e) => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        if (!s) return;
                        const currentH24 = s.getHours();
                        const ampm = currentH24 >= 12 ? "PM" : "AM";
                        const h12 = Number(e.target.value);
                        const newH24 = (h12 % 12) + (ampm === "PM" ? 12 : 0);
                        setTime(newH24, s.getMinutes());
                      }}
                    >
                      {Array.from({ length: 12 }).map((_, idx) => {
                        const h12 = idx + 1; // 1..12
                        return (
                          <option key={h12} value={h12}>{String(h12).padStart(2, "0")}</option>
                        );
                      })}
                    </select>
                    :
                    <select
                      aria-label="Minutes"
                      className="rounded border border-slate-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={(() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        return s ? s.getMinutes() : 0;
                      })()}
                      onChange={(e) => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        if (!s) return;
                        const m = Number(e.target.value);
                        setTime(s.getHours(), m);
                      }}
                    >
                      {Array.from({ length: 60 }).map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      aria-label="AM/PM"
                      className="rounded border border-slate-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={(() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        const h24 = s ? s.getHours() : 0;
                        return h24 >= 12 ? "PM" : "AM";
                      })()}
                      onChange={(e) => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        if (!s) return;
                        const makePM = e.target.value === "PM";
                        const base = s.getHours() % 12; // 0..11
                        const newH24 = base + (makePM ? 12 : 0);
                        setTime(newH24, s.getMinutes());
                      }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      aria-label="Hours"
                      className="rounded border border-slate-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={(() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        return s ? s.getHours() : 0;
                      })()}
                      onChange={(e) => setTime(Number(e.target.value), (() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        return s ? s.getMinutes() : 0;
                      })())}
                    >
                      {Array.from({ length: 24 }).map((_, h) => (
                        <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                      ))}
                    </select>
                    :
                    <select
                      aria-label="Minutes"
                      className="rounded border border-slate-300 p-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={(() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        return s ? s.getMinutes() : 0;
                      })()}
                      onChange={(e) => setTime((() => {
                        const s = Array.isArray(selected) ? selected[0] : selected;
                        return s ? s.getHours() : 0;
                      })(), Number(e.target.value))}
                    >
                      {Array.from({ length: 60 }).map((_, m) => (
                        <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          )}

          <div className={cn("footer", "mt-3 flex items-center justify-end gap-2")}>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DatePickerImpl.displayName = "DatePicker";

const isDateEqual = (a?: Date | null, b?: Date | null) => {
  if (a == null && b == null) return true;
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
};
const isDateArrayEqual = (a?: Date[] | null, b?: Date[] | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].getTime() !== b[i].getTime()) return false;
  }
  return true;
};
const isValueEqual = (
  a: Date | Date[] | null | undefined,
  b: Date | Date[] | null | undefined
) => {
  const arrA = Array.isArray(a);
  const arrB = Array.isArray(b);
  if (arrA || arrB)
    return isDateArrayEqual(arrA ? (a as Date[]) : null, arrB ? (b as Date[]) : null);
  return isDateEqual((a as Date | null | undefined) ?? null, (b as Date | null | undefined) ?? null);
};
const isDisabledDatesEqual = (
  a?: DisabledDatesProp,
  b?: DisabledDatesProp
) => {
  if (a === b) return true;
  if (!a || !b) return false;
  if (typeof a === "function" || typeof b === "function") return false;
  const arrA = a as Array<Date | string | number>;
  const arrB = b as Array<Date | string | number>;
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    const av = arrA[i];
    const bv = arrB[i];
    if (av instanceof Date && bv instanceof Date) {
      if (av.getTime() !== bv.getTime()) return false;
    } else if (av !== bv) return false;
  }
  return true;
};

const areEqual = (prev: DatePickerProps, next: DatePickerProps) => {
  return (
    isValueEqual(prev.value, next.value) &&
    prev.multiple === next.multiple &&
    prev.isDateTime === next.isDateTime &&
    prev.use12Hour === next.use12Hour &&
    prev.disabled === next.disabled &&
    prev.readOnly === next.readOnly &&
    prev.placeholder === next.placeholder &&
    prev.format === next.format &&
    prev.weekStartsOn === next.weekStartsOn &&
    prev.disablePast === next.disablePast &&
    prev.disableFuture === next.disableFuture &&
    isDateEqual(prev.minDate ?? null, next.minDate ?? null) &&
    isDateEqual(prev.maxDate ?? null, next.maxDate ?? null) &&
    isDisabledDatesEqual(prev.disabledDates, next.disabledDates) &&
    prev.classNames === next.classNames &&
    prev.icons === next.icons &&
    prev.open === next.open &&
    prev.onOpenChange === next.onOpenChange &&
    prev.onChange === next.onChange
  );
};

const DatePicker = React.memo(DatePickerImpl, areEqual);
(DatePicker as any).displayName = "DatePicker";

export { DatePicker };
export default DatePicker;
