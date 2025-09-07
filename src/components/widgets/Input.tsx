"use client";
import * as React from "react";
import clsx from "clsx";

type NativeInput = React.InputHTMLAttributes<HTMLInputElement>;
type NativeTextarea = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "ghost";

type UIProps = {
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: boolean | React.ReactNode;
  success?: boolean;
  readonly?: boolean;

  size?: Size;
  variant?: Variant;
  fullWidth?: boolean;

  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;

  clearable?: boolean;
  passwordToggle?: boolean;
  showToggle?: boolean;
  loading?: boolean;

  counter?: boolean;
  autoResize?: boolean;

  debounceMs?: number;

  value?: string;
  defaultValue?: string;

  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onValueChange?: (value: string) => void;

  pickerIcon?: React.ReactNode;
  pickerAriaLabel?: string;

  className?: string;
  classNames?: {
    container?: string;
    wrapper?: string;
    label?: string;
    input?: string;
    description?: string;
    error?: string;
    counter?: string;
    errorIcon?: string;
    clearIcon?: string;
    passwordIcon?: string;
    loadingIcon?: string;
    pickerIcon?: string;
    leftSection?: string;
    rightSection?: string;
    leadingIcon?: string;
    trailingIcon?: string;
  };
};

type InputOnly = Omit<
  NativeInput,
  "size" | "onChange" | "value" | "defaultValue" | "children"
> & {
  multiline?: false;
  type?: React.HTMLInputTypeAttribute;
};

type TextareaOnly = Omit<
  NativeTextarea,
  "size" | "onChange" | "value" | "defaultValue" | "children"
> & {
  multiline: true;
  rows?: number;
  type?: never;
};

export type InputProps = UIProps & (InputOnly | TextareaOnly);

function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(value);
      else {
        try {
          (ref as React.MutableRefObject<T | null>).current = value;
        } catch {}
      }
    });
  };
}

export const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(function Input(_props, forwardedRef) {
  const props = _props as InputProps & { showToggle?: boolean };

  const {
    label,
    readonly,
    description,
    error,
    success,
    size = "md",
    variant = "outline",
    fullWidth,
    leftSection,
    rightSection,
    leadingIcon,
    trailingIcon,
    clearable,
    passwordToggle,
    showToggle: showToggleAlias,
    loading,
    counter,
    autoResize,
    debounceMs = 0,

    value,
    defaultValue,
    onChange,
    onValueChange,

    pickerIcon,
    pickerAriaLabel,

    className,
    classNames = {},

    disabled,
    readOnly,
    required,
    placeholder,
    maxLength,

    multiline,
    ...rest
  } = props;

  const inputRest = (!multiline ? (rest as InputOnly) : undefined) || undefined;
  const textareaRest =
    (multiline ? (rest as TextareaOnly) : undefined) || undefined;

  const internalId = React.useId();
  const inputId =
    (inputRest as any)?.id ?? (textareaRest as any)?.id ?? internalId;
  const describedById = `${inputId}-desc`;
  const errorId = `${inputId}-err`;
  const counterId = `${inputId}-ctr`;

  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState<string>(defaultValue ?? "");
  const val = (isControlled ? value : inner) ?? "";

  const isTextarea = !!multiline;
  const inputType = !isTextarea ? (inputRest?.type ?? "text") : "text";
  const isPasswordType = !isTextarea && inputType === "password";
  const isPickerType =
    !isTextarea &&
    ["date", "time", "datetime-local", "month", "week"].includes(inputType);

  const wantsToggle = passwordToggle ?? showToggleAlias;
  const computedToggle =
    !isTextarea && isPasswordType && wantsToggle !== false;

  const [show, setShow] = React.useState(false);
  const actualType = computedToggle ? (show ? "text" : "password") : inputType;

  const fieldRef =
    React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const setRefs = mergeRefs(fieldRef, forwardedRef);

  const autoResizeFn = React.useCallback(() => {
    if (!autoResize || !isTextarea) return;
    const ta = fieldRef.current as HTMLTextAreaElement | null;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
  }, [autoResize, isTextarea]);

  React.useEffect(() => {
    autoResizeFn();
  }, [val, autoResizeFn]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    onChange?.(e);
    if (!isControlled) setInner(e.target.value);
    autoResizeFn();
  };

  React.useEffect(() => {
    if (!onValueChange) return;
    if (debounceMs > 0) {
      const id = window.setTimeout(() => onValueChange(val), debounceMs);
      return () => window.clearTimeout(id);
    }
    onValueChange(val);
  }, [val, debounceMs, onValueChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = "";
    if (!isControlled) setInner(next);
    const target = fieldRef.current as HTMLInputElement | HTMLTextAreaElement;
    if (target) {
      const proto = Object.getPrototypeOf(target);
      const desc = Object.getOwnPropertyDescriptor(proto, "value");
      desc?.set?.call(target, next);
      target.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  const sizes: Record<Size, string> = {
    sm: "h-9 px-3",
    md: "h-10 px-3.5",
    lg: "h-11 px-4 text-base",
  };
  const variants: Record<Variant, string> = {
    outline:
      "border border-slate-300 bg-white focus:ring-2 focus:ring-slate-200 focus:border-slate-400",
    filled:
      "border border-transparent bg-slate-100 focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
    ghost:
      "border border-transparent bg-transparent focus:border-slate-300 focus:ring-2 focus:ring-slate-200",
  };

  const base =
    "w-full rounded-md text-sm placeholder-slate-400 outline-none transition";
  const stateRing = clsx(
    error && "border-red-500 focus:ring-red-200 focus:border-red-500",
    success &&
      !error &&
      "border-green-500 focus:ring-green-200 focus:border-green-500",
    disabled && "opacity-60 cursor-not-allowed"
  );

  const leftPad = leadingIcon ? "pl-9" : leftSection ? "pl-14" : "";

  const hasPickerBtn = !!pickerIcon && isPickerType && !isTextarea;
  const needsRightPad =
    (clearable && val) ||
    computedToggle ||
    trailingIcon ||
    loading ||
    rightSection ||
    hasPickerBtn;
  const rightPad = needsRightPad ? "pr-10" : "";

  const fieldClasses = clsx(
    base,
    sizes[size],
    variants[variant],
    leftPad,
    rightPad,
    readonly && "bg-slate-50",
    className,
    classNames.input,
    hasPickerBtn && "hide-native-picker"
  );

  const wrapper = clsx(fullWidth && "w-full", classNames.wrapper);

  const messageId =
    typeof error === "string" || typeof error === "object"
      ? errorId
      : description
      ? describedById
      : undefined;

  const showCounter = !!counter && typeof maxLength === "number";

  const openNativePicker = () => {
    const el = fieldRef.current as HTMLInputElement | null;
    if (el && "showPicker" in el && typeof (el as any).showPicker === "function") {
      (el as any).showPicker();
    } else {
      el?.focus();
    }
  };

  return (
    <div className={wrapper}>
      {label && (
        <label
          htmlFor={inputId}
          className={clsx(
            "mb-1 block text-sm font-medium",
            error ? "text-red-600" : "text-slate-900",
            classNames.label
          )}
        >
          {label}
          {required && <span className="ms-0.5 text-red-600">*</span>}
        </label>
      )}

      <>
        <div className={clsx("relative", classNames.container)}>
          {leftSection && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 left-0 flex items-center",
                classNames.leftSection
              )}
            >
              <div className="mx-2 rounded-md bg-slate-100 px-2 text-slate-900">
                {leftSection}
              </div>
            </div>
          )}

          {leadingIcon && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400",
                classNames.leadingIcon
              )}
            >
              {leadingIcon}
            </div>
          )}

          {rightSection && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                classNames.rightSection
              )}
            >
              <div className="mx-2 rounded-md bg-slate-100 px-2 text-slate-900">
                {rightSection}
              </div>
            </div>
          )}

          {trailingIcon && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400",
                classNames.trailingIcon
              )}
            >
              {trailingIcon}
            </div>
          )}

          {clearable && !!val && !readOnly && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className={clsx(
                "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900",
                (computedToggle || hasPickerBtn) && "right-9",
                classNames.clearIcon
              )}
              aria-label="Clear input"
              tabIndex={-1}
            >
              ×
            </button>
          )}

          {computedToggle && !readOnly && !disabled && (
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className={clsx(
                "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900",
                classNames.passwordIcon
              )}
              aria-label={show ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {show ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M2 12s4-7 10-7c2.5 0 4.7.9 6.5 2.2M22 12s-4 7-10 7c-2.3 0-4.4-.8-6.2-2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          )}

          {hasPickerBtn && (
            <button
              type="button"
              onClick={openNativePicker}
              className={clsx(
                "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-900",
                classNames.pickerIcon
              )}
              aria-label={pickerAriaLabel ?? "Open picker"}
              tabIndex={-1}
            >
              {pickerIcon}
            </button>
          )}

          {loading && (
            <div
              className={clsx(
                "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                (clearable && val) || computedToggle || hasPickerBtn ? "mr-10" : "mr-2",
                classNames.loadingIcon
              )}
            >
              <svg className="h-4 w-4 animate-spin text-slate-400" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
            </div>
          )}

          {readonly ? (
            <div
              className={clsx(
                fieldClasses,
                stateRing,
                leftSection && "pl-14",
                rightSection && "pr-14",
                "flex items-center"
              )}
            >
              {val}
            </div>
          ) : isTextarea ? (
            <textarea
              id={inputId}
              ref={setRefs as React.Ref<HTMLTextAreaElement>}
              className={clsx(
                "py-2",
                fieldClasses,
                stateRing,
                leftSection && "pl-14",
                rightSection && "pr-14"
              )}
              aria-invalid={!!error || undefined}
              aria-describedby={messageId || (showCounter ? counterId : undefined)}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              placeholder={placeholder}
              maxLength={maxLength}
              value={val}
              onChange={handleChange}
              {...(textareaRest as Omit<
                NativeTextarea,
                "onChange" | "value" | "defaultValue"
              >)}
            />
          ) : (
            <input
              id={inputId}
              ref={setRefs as React.Ref<HTMLInputElement>}
              className={clsx(
                fieldClasses,
                stateRing,
                leftSection && "pl-14",
                rightSection && "pr-14"
              )}
              aria-invalid={!!error || undefined}
              aria-describedby={messageId || (showCounter ? counterId : undefined)}
              disabled={disabled}
              readOnly={readOnly}
              required={required}
              placeholder={placeholder}
              maxLength={maxLength}
              value={val}
              onChange={handleChange}
              {...(inputRest as Omit<
                NativeInput,
                "onChange" | "value" | "defaultValue"
              >)}
              type={actualType}
            />
          )}
        </div>

        {(showCounter || !!error || !!description) && (
          <div className="mt-1 flex items-start justify-between text-xs">
            <div className="min-h-[1rem]">
              {typeof error !== "boolean" && error ? (
                <p id={errorId} className={clsx("text-red-600", classNames.error)}>
                  {error}
                </p>
              ) : description ? (
                <p
                  id={describedById}
                  className={clsx("text-slate-500", classNames.description)}
                >
                  {description}
                </p>
              ) : null}
            </div>
            {showCounter && (
              <div id={counterId} className={clsx("text-slate-400", classNames.counter)}>
                {val.length}/{maxLength}
              </div>
            )}
          </div>
        )}

        {hasPickerBtn && (
          <style>{`
            input.hide-native-picker::-webkit-calendar-picker-indicator{opacity:0;display:none;pointer-events:none}
            input.hide-native-picker::-webkit-inner-spin-button{-webkit-appearance:none;display:none}
            input.hide-native-picker{background-image:none}
          `}</style>
        )}
      </>
    </div>
  );
});

Input.displayName = "Input";

export default Input;
