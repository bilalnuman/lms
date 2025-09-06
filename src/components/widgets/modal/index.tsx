"use client";

import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
    useState,
    type CSSProperties,
    type MouseEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import styles from "./index.module.css"

/** Imperative API exposed via ref */
export type ModalRef = {
    open: () => void;
    close: () => void;
    confirm: (payload?: any) => void;
    toggle: (next?: boolean) => void;
    isOpen: () => boolean;
};

export type classNames = {
    buttonContainer?: string;
    confirm?: string;
    cancel?: string;
    panel?: string;
    backdrop?: string;
    container?: string;
}

type ModalProps = {
    /** If provided, component becomes controlled */
    open?: boolean;
    /** Setter for controlled mode */
    setOpen?: (v: boolean) => void;

    /** Called after a close action (ESC/backdrop/X or ref.close) */
    onClose?: () => void;
    /** Called when confirm happens; can be async */
    onConfirm?: (payload?: any) => void | Promise<void>;

    children: ReactNode;

    /** Disable ESC/backdrop/X and hide Cancel button */
    noCancel?: boolean;

    /** Portal target (defaults to #modal-root or document.body) */
    container?: Element | null;

    /** Transition duration (ms) */
    timeout?: number;

    /** Show the “X” close button (ignored when noCancel = true) */
    showCloseButton?: boolean;

    /** Show default footer with Cancel/Confirm buttons */
    showFooterButtons?: boolean;

    /** Optional inline style overrides */
    backdropStyle?: CSSProperties;
    panelStyle?: CSSProperties;
    footerStyle?: CSSProperties;

    /** Customize Confirm/Cancel labels */
    confirmText?: string;
    cancelText?: string;

    classNames?: classNames,
    type?: "button" | "reset" | "submit"
};

const Modal = forwardRef<ModalRef, ModalProps>(function Modal(
    {
        open: openProp,
        setOpen,
        onClose,
        onConfirm,
        children,
        noCancel = false,
        container,
        timeout = 500,
        showCloseButton = true,
        showFooterButtons = false,
        backdropStyle,
        panelStyle,
        footerStyle,
        confirmText = "Confirm",
        cancelText = "Cancel",
        classNames = {},
        type = "button"
    },
    ref
) {
    // Controlled vs uncontrolled
    const isControlled = typeof openProp === "boolean";
    const [openUncontrolled, setOpenUncontrolled] = useState(false);
    const openState = isControlled ? (openProp as boolean) : openUncontrolled;

    /** Transition phases for smooth enter/exit */
    type Phase = "unmounted" | "enter" | "entered" | "exit";
    const [phase, setPhase] = useState<Phase>("unmounted");
    const raf1 = useRef<number | null>(null);
    const raf2 = useRef<number | null>(null);
    const exitTimer = useRef<number | null>(null);

    const mounted = phase !== "unmounted";
    const visible = phase === "enter" || phase === "entered";

    /** Safe setter that respects controlled/uncontrolled */
    const setOpenSafe = (v: boolean) => {
        if (isControlled) setOpen?.(v);
        else setOpenUncontrolled(v);
    };

    /** Imperative API */
    useImperativeHandle(
        ref,
        () => ({
            open: () => setOpenSafe(true),
            close: () => {
                setOpenSafe(false);
                onClose?.();
            },
            confirm: (payload?: any) => {
                void handleConfirm(payload);
            },
            toggle: (next?: boolean) =>
                setOpenSafe(typeof next === "boolean" ? next : !openState),
            isOpen: () => openState,
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [openState, setOpen, onClose, isControlled]
    );

    /** Body scroll lock while mounted */
    useEffect(() => {
        if (!mounted) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [mounted]);

    /** Transition state machine with double rAF to guarantee first paint at opacity 0 (MUI-like) */
    useLayoutEffect(() => {
        if (raf1.current) cancelAnimationFrame(raf1.current);
        if (raf2.current) cancelAnimationFrame(raf2.current);
        if (exitTimer.current) window.clearTimeout(exitTimer.current);

        if (openState) {
            setPhase("enter"); // mount at 0 opacity
            raf1.current = requestAnimationFrame(() => {
                raf2.current = requestAnimationFrame(() => setPhase("entered")); // then fade to 1
            });
        } else {
            if (phase !== "unmounted") {
                setPhase("exit"); // start fade out
                exitTimer.current = window.setTimeout(
                    () => setPhase("unmounted"),
                    timeout
                );
            }
        }

        return () => {
            if (raf1.current) cancelAnimationFrame(raf1.current);
            if (raf2.current) cancelAnimationFrame(raf2.current);
            if (exitTimer.current) window.clearTimeout(exitTimer.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [openState, timeout]);

    /** ESC close (when allowed) */
    useEffect(() => {
        if (!visible || noCancel) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, noCancel]);

    /** Portal target */
    const target =
        typeof window !== "undefined"
            ? container ?? document.getElementById("modal-root") ?? document.body
            : null;

    if (!mounted || !target) return null;

    /** Close helper */
    const handleClose = () => {
        setOpenSafe(false);
        onClose?.();
    };

    /** Confirm helper (supports async onConfirm) */
    const handleConfirm = async (payload?: any) => {
        try {
            const maybe = onConfirm?.(payload);
            if (maybe && typeof (maybe as Promise<unknown>).then === "function") {
                await (maybe as Promise<unknown>);
            }
        } finally {
            setOpenSafe(false);
        }
    };

    /** Close on backdrop click (when allowed) */
    const onBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
        if (noCancel) return;
        if (e.target === e.currentTarget) handleClose();
    };

    /** --- Inline styles (no libraries) --- */
    const backdropBase: CSSProperties = {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.2)",
        backdropFilter: "blur(4px)",
        transition: `opacity ${timeout}ms ease`,
        opacity: phase === "entered" ? 1 : 0,
        zIndex: 1300,
    };

    const panelBase: CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: 480,
        margin: "0 16px",
        background: "#fff",
        color: "#111827",
        borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        padding: 24,
        maxHeight: "95vh",
        overflowY: "auto",
        transition: `opacity ${timeout}ms ease, transform ${timeout}ms ease`,
        transform: phase === "entered" ? "scale(1)" : "scale(0.97)",
        opacity: phase === "entered" ? 1 : 0,
    };

    const closeBtn: CSSProperties = {
        position: "absolute",
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        border: "none",
        borderRadius: 6,
        background: "transparent",
        color: "#6b7280",
        fontSize: 22,
        lineHeight: 1,
        cursor: "pointer",
        transition: "color 150ms ease",
    };

    const footerBase: CSSProperties = {
        marginTop: 16,
        display: "flex",
        justifyContent: "flex-end",
        gap: 8,
    };

    const btnBase: CSSProperties = {
        padding: "8px 12px",
        fontSize: 14,
        borderRadius: 8,
        border: "1px solid #d1d5db",
        background: "#f9fafb",
        cursor: "pointer",
    };

    const btnPrimary: CSSProperties = {
        ...btnBase,
        background: "#2563eb",
        color: "#fff",
        border: "1px solid #2563eb",
    };

    return createPortal(
        <div
            style={{ ...backdropBase, ...backdropStyle }}
            onClick={onBackdropClick}
            role="presentation"
            aria-hidden={!visible}
            className={`${classNames?.backdrop} ${classNames?.container}`}
        >
            <div
                style={{ ...panelBase, ...panelStyle }}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                className={classNames?.panel}
            >
                {!noCancel && showCloseButton && (
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={handleClose}
                        style={closeBtn}
                        className={styles.closeBtn}
                    >
                        ×
                    </button>
                )}

                {children}

                {showFooterButtons && (
                    <div style={{ ...footerBase, ...footerStyle }}
                        className={`${styles.buttons} ${classNames?.buttonContainer}`}
                    >
                        {!noCancel && (
                            <button type="button" onClick={handleClose} style={btnBase}
                                className={classNames?.cancel}
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            type={type}
                            onClick={handleConfirm}
                            style={btnPrimary}
                            className={classNames?.confirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        target
    );
});

export default Modal;
