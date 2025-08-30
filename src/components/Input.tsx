"use client";
import * as React from "react";
import clsx from "clsx";

type NativeInput = React.InputHTMLAttributes<HTMLInputElement>;
type NativeTextarea = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

type Size = "sm" | "md" | "lg";
type Variant = "outline" | "filled" | "ghost";

/** Visual/behavior props common to input + textarea */
type UIProps = {
    label?: React.ReactNode;
    description?: React.ReactNode;
    /** true → error styles; ReactNode → styles + message */
    error?: boolean | React.ReactNode;
    success?: boolean;

    size?: Size;
    variant?: Variant;
    fullWidth?: boolean;

    leftSection?: React.ReactNode;   // addon block inside left
    rightSection?: React.ReactNode;  // addon block inside right
    leadingIcon?: React.ReactNode;   // icon inside padding-left
    trailingIcon?: React.ReactNode;  // icon inside padding-right

    clearable?: boolean;
    passwordToggle?: boolean;        // only when type="password"
    loading?: boolean;

    counter?: boolean;               // shows with maxLength
    autoResize?: boolean;            // textarea auto-resize

    /** debounce ms for onValueChange (fires for controlled & uncontrolled) */
    debounceMs?: number;

    /** unified value/defaultValue for both modes */
    value?: string;
    defaultValue?: string;

    /** DOM change event (input or textarea) */
    onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;

    /** simplified value callback (debounced if debounceMs > 0) */
    onValueChange?: (value: string) => void;

    /** Custom picker button for date/time/datetime-local/month/week */
    pickerIcon?: React.ReactNode;
    pickerAriaLabel?: string;

    /** Extra classes applied directly to the field element (input/textarea) */
    className?: string;

    /** Slot-based class overrides */
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

/** Input-only native props (exclude conflicting fields) */
type InputOnly = Omit<
    NativeInput,
    "size" | "onChange" | "value" | "defaultValue" | "children"
> & {
    multiline?: false; // discriminator
    type?: React.HTMLInputTypeAttribute;
};

/** Textarea-only native props (exclude conflicting fields) */
type TextareaOnly = Omit<
    NativeTextarea,
    "size" | "onChange" | "value" | "defaultValue" | "children"
> & {
    multiline: true; // discriminator
    rows?: number;
    /** block incompatible props */
    type?: never;
};

export type InputProps = UIProps & (InputOnly | TextareaOnly);

export const Input = React.forwardRef<
    HTMLInputElement | HTMLTextAreaElement,
    InputProps
>(function Input(props, ref) {
    const {
        // UI
        label,
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
        loading,
        counter,
        autoResize,
        debounceMs = 0,

        // controlled/uncontrolled
        value,
        defaultValue,
        onChange,
        onValueChange,

        pickerIcon,
        pickerAriaLabel,

        className,             // extra classes for field element
        classNames = {},       // slot overrides

        // common native
        disabled,
        readOnly,
        required,
        placeholder,
        maxLength,

        // discriminator
        multiline,
        ...rest
    } = props as InputProps;

    // Split the remaining native props by discriminator so we spread the right ones
    const inputRest = (!multiline ? (rest as InputOnly) : undefined) || undefined;
    const textareaRest = (multiline ? (rest as TextareaOnly) : undefined) || undefined;

    // ids
    const internalId = React.useId();
    const inputId =
        (inputRest as any)?.id ?? (textareaRest as any)?.id ?? internalId;
    const describedById = `${inputId}-desc`;
    const errorId = `${inputId}-err`;
    const counterId = `${inputId}-ctr`;

    // controlled or uncontrolled
    const isControlled = value !== undefined;
    const [inner, setInner] = React.useState<string>(defaultValue ?? "");
    const val = (isControlled ? value : inner) ?? "";

    // textarea vs input
    const isTextarea = !!multiline;

    // determine input type + picker kind
    const inputType = !isTextarea ? (inputRest?.type ?? "text") : "text";
    const isPasswordType = !isTextarea && inputType === "password";
    const isPickerType =
        !isTextarea &&
        ["date", "time", "datetime-local", "month", "week"].includes(inputType);

    // password visibility toggle
    const showToggle = !isTextarea && isPasswordType && !!passwordToggle;
    const [show, setShow] = React.useState(false);
    const actualType = showToggle ? (show ? "text" : "password") : inputType;

    // refs
    const fieldRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
    React.useImperativeHandle(ref, () => fieldRef.current as any);

    // textarea auto-resize
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

    // CHANGE HANDLER — update state & bubble native onChange. Do NOT call onValueChange here.
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        onChange?.(e);
        if (!isControlled) setInner(e.target.value);
        autoResizeFn();
    };

    // DEBOUNCED VALUE EMITTER — fires for both controlled & uncontrolled
    React.useEffect(() => {
        if (!onValueChange) return;
        if (debounceMs > 0) {
            const id = setTimeout(() => onValueChange(val), debounceMs);
            return () => clearTimeout(id);
        }
        onValueChange(val);
    }, [val, debounceMs, onValueChange]);

    // clear
    const handleClear = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const next = "";
        if (!isControlled) setInner(next);

        // synthesize an input event so parent's onChange fires (works for controlled too)
        const target = fieldRef.current!;
        const proto = Object.getPrototypeOf(target);
        const desc = Object.getOwnPropertyDescriptor(proto, "value");
        desc?.set?.call(target, next);
        target.dispatchEvent(new Event("input", { bubbles: true }));
    };

    // styling
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
        success && !error && "border-green-500 focus:ring-green-200 focus:border-green-500",
        disabled && "opacity-60 cursor-not-allowed"
    );

    const leftPad = leadingIcon ? "pl-9" : leftSection ? "pl-14" : "";

    // Right padding depends on which right-side controls are visible
    const hasPickerBtn = !!pickerIcon && isPickerType && !isTextarea;
    const needsRightPad =
        (clearable && val) ||
        showToggle ||
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
        readOnly && "bg-slate-50",
        className,                 // external extra classes for field
        classNames.input,          // slot override for field
        // Hide the native picker icon via class when we render a custom one
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

    // Opens the native date/time picker
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
            {/* label */}
            {label && (
                <label
                    htmlFor={inputId}
                    className={clsx(
                        "mb-1 block text-sm font-medium",
                        error ? "text-red-600" : "text-slate-700",
                        classNames.label
                    )}
                >
                    {label}
                    {required && <span className="ms-0.5 text-red-600">*</span>}
                </label>
            )}

            {/* field container */}
            <div className={clsx("relative", classNames.container)}>
                {/* left addon */}
                {leftSection && (
                    <div
                        className={clsx(
                            "pointer-events-none absolute inset-y-0 left-0 flex items-center",
                            classNames.leftSection
                        )}
                    >
                        <div className="mx-2 rounded-md bg-slate-100 px-2 text-slate-600">
                            {leftSection}
                        </div>
                    </div>
                )}

                {/* leading icon */}
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

                {/* right addon */}
                {rightSection && (
                    <div
                        className={clsx(
                            "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                            classNames.rightSection
                        )}
                    >
                        <div className="mx-2 rounded-md bg-slate-100 px-2 text-slate-600">
                            {rightSection}
                        </div>
                    </div>
                )}

                {/* trailing icon (non-clickable decoration) */}
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

                {/* clear (shift left if picker button exists or toggle exists) */}
                {clearable && !!val && !readOnly && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={clsx(
                            "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700",
                            (showToggle || hasPickerBtn) && "right-9",
                            classNames.clearIcon
                        )}
                        aria-label="Clear input"
                        tabIndex={-1}
                    >
                        ×
                    </button>
                )}

                {/* password toggle (eye) — rightmost when present */}
                {showToggle && (
                    <button
                        type="button"
                        onClick={() => setShow((v) => !v)}
                        className={clsx(
                            "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700",
                            classNames.passwordIcon
                        )}
                        aria-label={show ? "Hide password" : "Show password"}
                        tabIndex={-1}
                    >
                        {show ? (
                            // eye-off
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
                                <path d="M2 12s4-7 10-7c2.5 0 4.7.9 6.5 2.2M22 12s-4 7-10 7c-2.3 0-4.4-.8-6.2-2" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        ) : (
                            // eye
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                        )}
                    </button>
                )}

                {/* custom picker button (rightmost for date/time/etc.; if clear also shown, clear shifts left) */}
                {hasPickerBtn && (
                    <button
                        type="button"
                        onClick={openNativePicker}
                        className={clsx(
                            "absolute inset-y-0 right-1 z-10 my-1 flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700",
                            classNames.pickerIcon
                        )}
                        aria-label={pickerAriaLabel ?? "Open picker"}
                        tabIndex={-1}
                    >
                        {pickerIcon}
                    </button>
                )}

                {/* loading indicator (shifts left if clear/toggle/picker present) */}
                {loading && (
                    <div
                        className={clsx(
                            "pointer-events-none absolute inset-y-0 right-0 flex items-center",
                            (clearable && val) || showToggle || hasPickerBtn ? "mr-10" : "mr-2",
                            classNames.loadingIcon
                        )}
                    >
                        <svg className="h-4 w-4 animate-spin text-slate-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                    </div>
                )}

                {/* FIELD */}
                {isTextarea ? (
                    <textarea
                        id={inputId}
                        ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
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
                        ref={fieldRef as React.RefObject<HTMLInputElement>}
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

            {/* helper / error / counter */}
            {(showCounter || !!error || !!description) && (
                <div className="mt-1 flex items-start justify-between text-xs">
                    <div className="min-h-[1rem]">
                        {typeof error !== "boolean" && error ? (
                            <p id={errorId} className={clsx("text-red-600", classNames.error)}>
                                {error}
                            </p>
                        ) : description ? (
                            <p id={describedById} className={clsx("text-slate-500", classNames.description)}>
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

            {/* Scoped global CSS to hide native picker icon when we render a custom one */}
            {hasPickerBtn && (
                <style jsx global>{`
          input.hide-native-picker::-webkit-calendar-picker-indicator {
            opacity: 0;
            display: none;
            pointer-events: none;
          }
          input.hide-native-picker::-webkit-inner-spin-button {
            -webkit-appearance: none;
            display: none;
          }
          input.hide-native-picker {
            background-image: none;
          }
        `}</style>
            )}
        </div>
    );
});

export default Input;
