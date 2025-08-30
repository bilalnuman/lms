"use client";
/* eslint-disable @next/next/no-img-element */
import * as React from "react";

// ——————————————————————————————————————————————————————————————
// Reusable FilePicker for Next.js (TypeScript, Client Component)
// Features:
// - Click, drag & drop, and paste files
// - Accept filter (e.g., "image/*,.pdf")
// - Multiple selection with maxFiles, maxFileSize, maxTotalSize
// - Image previews + generic icons
// - Keyboard accessible (Enter/Space)
// - Remove/clear, dedupe files, error display
// - Optional built‑in uploader using XHR with progress, cancel, retry
// - Tailwind CSS styling (no external deps)
// ——————————————————————————————————————————————————————————————

export type FilePickerRef = {
    clear: () => void;
    startUpload: () => Promise<void>;
    addFiles: (files: File[] | FileList) => void;
    getFiles: () => File[];
};

export type FilePickerProps = {
    accept?: string | string[];
    multiple?: boolean;
    maxFiles?: number;
    maxFileSize?: number; // per-file, in bytes
    maxTotalSize?: number; // across all files, in bytes
    value?: File[]; // optional controlled mode
    onChange?: (files: File[]) => void;
    disabled?: boolean;
    allowPaste?: boolean;
    capture?: "user" | "environment"; // for mobile camera
    showPreview?: boolean;
    className?: string;
    // Built-in upload (optional)
    uploadUrl?: string; // POST target for each file (multipart/form-data)
    uploadFieldName?: string; // defaults to "file"
    uploadHeaders?: Record<string, string>;
    uploadExtraData?: Record<string, string | number | boolean>;
    autoUpload?: boolean; // start upload automatically upon add
    onUploadComplete?: (
        results: Array<{ file: File; response?: any; error?: Error | string }>
    ) => void;
    locale?: Partial<typeof defaultLocale>;
};

const defaultLocale = {
    dropHere: "Drop files here or",
    browse: "browse",
    pasteHint: "You can also paste images/files",
    maxFilesExceeded: (n: number) => `Maximum ${n} files allowed`,
    maxFileSizeExceeded: (n: string) => `File exceeds ${n}`,
    maxTotalExceeded: (n: string) => `Total size exceeds ${n}`,
    invalidType: "File type not accepted",
    remove: "Remove",
    clearAll: "Clear all",
    uploading: "Uploading…",
    upload: "Upload",
    cancel: "Cancel",
    retry: "Retry",
    added: "Added",
};

function cx(...classes: Array<string | false | undefined>) {
    return classes.filter(Boolean).join(" ");
}

function toArray(input?: string | string[]) {
    if (!input) return [] as string[];
    return Array.isArray(input) ? input : input.split(",").map((s) => s.trim());
}

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

function fileId(file: File) {
    return `${file.name}-${file.size}-${file.lastModified}`;
}

function isImage(file: File) {
    return file.type.startsWith("image/");
}

function acceptMatches(file: File, acceptList: string[]) {
    if (acceptList.length === 0) return true;
    const mime = file.type;
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    return acceptList.some((rule) => {
        rule = rule.toLowerCase();
        if (rule.startsWith(".")) return ext === rule; // .pdf
        if (rule.endsWith("/*")) {
            const prefix = rule.replace("/*", "/");
            return mime.startsWith(prefix);
        }
        return mime === rule; // full mime
    });
}

function useObjectUrl(file?: File) {
    const [url, setUrl] = React.useState<string | undefined>();
    React.useEffect(() => {
        if (!file) return;
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
    }, [file]);
    return url;
}

// Item state per file
type Item = {
    id: string;
    file: File;
    errors: string[];
    status: "idle" | "queued" | "uploading" | "success" | "error" | "canceled" | "rejected";
    progress: number; // 0..100
    xhr?: XMLHttpRequest | null;
};

export const FilePicker = React.forwardRef<FilePickerRef, FilePickerProps>(
    (
        {
            accept,
            multiple = true,
            maxFiles = Infinity,
            maxFileSize = Infinity,
            maxTotalSize = Infinity,
            value,
            onChange,
            disabled,
            allowPaste = true,
            capture,
            showPreview = true,
            className,
            uploadUrl,
            uploadFieldName = "file",
            uploadHeaders,
            uploadExtraData,
            autoUpload = false,
            onUploadComplete,
            locale: i18nOverrides,
        },
        ref
    ) => {
        const locale = { ...defaultLocale, ...(i18nOverrides || {}) };
        const inputRef = React.useRef<HTMLInputElement | null>(null);
        const zoneRef = React.useRef<HTMLDivElement | null>(null);
        const [dragOver, setDragOver] = React.useState(false);

        const [items, setItems] = React.useState<Item[]>([]);

        const currentFiles = React.useMemo(() => items.map((i) => i.file), [items]);

        // Controlled mode sync
        React.useEffect(() => {
            if (!value) return; // uncontrolled
            // Map controlled files into our items
            setItems((prev) => {
                const existing = new Map(prev.map((p) => [fileId(p.file), p]));
                const next: Item[] = [];
                for (const f of value) {
                    const id = fileId(f);
                    const found = existing.get(id);
                    next.push(
                        found || {
                            id,
                            file: f,
                            errors: [],
                            status: "idle",
                            progress: 0,
                            xhr: null,
                        }
                    );
                }
                return next;
            });
        }, [value]);

        // Notify parent
        React.useEffect(() => {
            onChange?.(currentFiles);
        }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

        const acceptList = React.useMemo(() => toArray(accept), [accept]);

        const totalSize = React.useMemo(
            () => items.reduce((a, b) => a + (b.status !== "rejected" ? b.file.size : 0), 0),
            [items]
        );

        const validateFile = React.useCallback(
            (file: File): string[] => {
                const errs: string[] = [];
                if (!acceptMatches(file, acceptList)) errs.push(locale.invalidType);
                if (file.size > maxFileSize) errs.push(locale.maxFileSizeExceeded(formatBytes(maxFileSize)));
                return errs;
            },
            [acceptList, maxFileSize, locale]
        );

        const addFiles = React.useCallback(
            (filesLike: File[] | FileList) => {
                const files = Array.from(filesLike);
                setItems((prev) => {
                    const map = new Map(prev.map((p) => [p.id, p]));

                    // Enforce maxFiles
                    const allowedRemaining = Math.max(0, maxFiles - Array.from(map.values()).filter((i) => i.status !== "rejected").length);
                    const incoming = files.slice(0, allowedRemaining);
                    const next: Item[] = Array.from(map.values());

                    if (files.length > incoming.length) {
                        // mark extras as rejected
                        for (const f of files.slice(incoming.length)) {
                            const id = fileId(f);
                            next.push({ id, file: f, errors: [locale.maxFilesExceeded(maxFiles)], status: "rejected", progress: 0 });
                        }
                    }

                    // Validate & dedupe
                    let incomingTotal = 0;
                    for (const f of incoming) incomingTotal += f.size;
                    const willTotal = totalSize + incomingTotal;
                    const totalExceeded = willTotal > maxTotalSize;

                    for (const f of incoming) {
                        const id = fileId(f);
                        if (map.has(id)) continue; // dedupe same file
                        const errors = validateFile(f);
                        if (totalExceeded) errors.push(locale.maxTotalExceeded(formatBytes(maxTotalSize)));

                        next.push({ id, file: f, errors, status: errors.length ? "rejected" : "idle", progress: 0 });
                    }
                    return next;
                });
            },
            [maxFiles, totalSize, maxTotalSize, validateFile, locale]
        );

        const removeItem = React.useCallback((id: string) => {
            setItems((prev) => prev.filter((p) => p.id !== id));
        }, []);

        const clear = React.useCallback(() => setItems([]), []);

        const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files) addFiles(e.target.files);
            // reset to allow same-file re-add
            if (inputRef.current) inputRef.current.value = "";
        };

        // Drag & drop handlers
        const onDrag = (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };
        const onDragEnter = (e: React.DragEvent) => {
            onDrag(e);
            setDragOver(true);
        };
        const onDragLeave = (e: React.DragEvent) => {
            onDrag(e);
            // only if leaving the zone
            if (zoneRef.current && !zoneRef.current.contains(e.relatedTarget as Node)) setDragOver(false);
        };
        const onDrop = (e: React.DragEvent) => {
            onDrag(e);
            setDragOver(false);
            if (disabled) return;
            if (e.dataTransfer.files && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        };

        // Paste support
        React.useEffect(() => {
            if (!allowPaste) return;
            const handler = (e: ClipboardEvent) => {
                if (disabled) return;
                const files = Array.from(e.clipboardData?.files || []);
                if (files.length) addFiles(files);
            };
            window.addEventListener("paste", handler);
            return () => window.removeEventListener("paste", handler);
        }, [allowPaste, addFiles, disabled]);

        // Upload logic (XHR per-file for progress + cancel)
        const startUpload = React.useCallback(async () => {
            if (!uploadUrl) return;
            const results: Array<{ file: File; response?: any; error?: Error | string }> = [];

            await Promise.all(
                items.map(async (it) => {
                    if (it.status === "rejected") {
                        results.push({ file: it.file, error: "rejected" });
                        return;
                    }
                    if (it.status === "success") {
                        results.push({ file: it.file, response: "already uploaded" });
                        return;
                    }

                    await new Promise<void>((resolve) => {
                        const form = new FormData();
                        form.append(uploadFieldName || "file", it.file, it.file.name);
                        if (uploadExtraData) {
                            Object.entries(uploadExtraData).forEach(([k, v]) => form.append(k, String(v)));
                        }
                        const xhr = new XMLHttpRequest();
                        xhr.open("POST", uploadUrl);
                        if (uploadHeaders) {
                            Object.entries(uploadHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
                        }
                        xhr.upload.onprogress = (ev) => {
                            if (ev.lengthComputable) {
                                const p = Math.round((ev.loaded / ev.total) * 100);
                                setItems((prev) => prev.map((pItem) => (pItem.id === it.id ? { ...pItem, progress: p, status: "uploading" } : pItem)));
                            }
                        };
                        xhr.onreadystatechange = () => {
                            if (xhr.readyState === 4) {
                                const ok = xhr.status >= 200 && xhr.status < 300;
                                setItems((prev) =>
                                    prev.map((pItem) =>
                                        pItem.id === it.id
                                            ? { ...pItem, status: ok ? "success" : "error", progress: ok ? 100 : pItem.progress, xhr: null }
                                            : pItem
                                    )
                                );
                                try {
                                    const response = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
                                    results.push({ file: it.file, response: ok ? response : xhr.responseText });
                                } catch {
                                    results.push({ file: it.file, response: ok ? xhr.responseText : undefined, error: ok ? undefined : xhr.responseText });
                                }
                                resolve();
                            }
                        };
                        xhr.onerror = () => {
                            setItems((prev) => prev.map((pItem) => (pItem.id === it.id ? { ...pItem, status: "error", xhr: null } : pItem)));
                            results.push({ file: it.file, error: "network error" });
                            resolve();
                        };
                        // set xhr so we can cancel
                        setItems((prev) => prev.map((pItem) => (pItem.id === it.id ? { ...pItem, xhr, status: "uploading", progress: 0 } : pItem)));
                        xhr.send(form);
                    });
                })
            );

            onUploadComplete?.(results);
        }, [items, uploadUrl, uploadFieldName, uploadHeaders, uploadExtraData, onUploadComplete]);

        // Auto-upload
        React.useEffect(() => {
            if (!autoUpload || !uploadUrl) return;
            const anyQueued = items.some((i) => i.status === "idle" || i.status === "queued");
            if (anyQueued) startUpload();
        }, [items, autoUpload, uploadUrl, startUpload]);

        const cancelUpload = (id: string) => {
            setItems((prev) => {
                const it = prev.find((p) => p.id === id);
                if (it?.xhr) {
                    try { it.xhr.abort(); } catch { }
                }
                return prev.map((p) => (p.id === id ? { ...p, status: "canceled", xhr: null } : p));
            });
        };

        // Expose ref methods
        React.useImperativeHandle(
            ref,
            (): FilePickerRef => ({
                clear,
                startUpload: async () => startUpload(),
                addFiles: (f) => addFiles(f),
                getFiles: () => items.filter((i) => i.status !== "rejected").map((i) => i.file),
            }),
            [clear, startUpload, addFiles, items]
        );

        const id = React.useId();

        const zoneKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
            }
        };

        return (
            <div className={cx("w-full", className)}>
                <div
                    ref={zoneRef}
                    role="button"
                    tabIndex={0}
                    aria-disabled={disabled}
                    onKeyDown={zoneKeyDown}
                    onDragEnter={onDragEnter}
                    onDragOver={onDrag}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={cx(
                        "group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center outline-none transition",
                        dragOver ? "border-blue-500 bg-blue-50" : "border-neutral-300 hover:border-neutral-400",
                        disabled && "pointer-events-none opacity-60"
                    )}
                >
                    <input
                        ref={inputRef}
                        id={id}
                        type="file"
                        accept={Array.isArray(accept) ? accept.join(",") : accept}
                        multiple={multiple}
                        capture={capture as any}
                        className="sr-only"
                        onChange={handleInputChange}
                        disabled={disabled}
                    />

                    <p className="text-sm text-neutral-600">
                        {locale.dropHere} <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="underline decoration-dotted underline-offset-4 outline-none focus:rounded-md focus:ring"
                        >
                            {locale.browse}
                        </button>
                    </p>
                    {allowPaste && (
                        <p className="text-xs text-neutral-400">{locale.pasteHint}</p>
                    )}
                </div>

                {/* Files list */}
                {items.length > 0 && (
                    <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between">
                            <div className="text-sm text-neutral-600">
                                {items.length} {items.length === 1 ? "file" : "files"} · {formatBytes(totalSize)}
                            </div>
                            <div className="flex gap-2">
                                {uploadUrl && (
                                    <button
                                        type="button"
                                        onClick={() => startUpload()}
                                        className="rounded-xl border px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
                                    >
                                        {locale.upload}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={clear}
                                    className="rounded-xl border px-3 py-1.5 text-sm shadow-sm hover:bg-neutral-50"
                                >
                                    {locale.clearAll}
                                </button>
                            </div>
                        </div>

                        <ul className="grid grid-cols-1 gap-2">
                            {items.map((it) => (
                                <li key={it.id} className="flex items-center gap-3 rounded-xl border p-3">
                                    <Preview file={it.file} show={showPreview} />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="truncate text-sm font-medium">{it.file.name}</p>
                                            <span className="whitespace-nowrap text-xs text-neutral-500">{formatBytes(it.file.size)}</span>
                                        </div>
                                        {it.errors.length > 0 ? (
                                            <div className="mt-1 text-xs text-red-600">{it.errors.join(" · ")}</div>
                                        ) : (
                                            <div className="mt-1 text-xs text-neutral-500">{it.status === "uploading" ? locale.uploading : locale.added}</div>
                                        )}

                                        {uploadUrl && (
                                            <ProgressBar progress={it.progress} status={it.status} />
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {uploadUrl && it.status === "uploading" && (
                                            <button
                                                type="button"
                                                onClick={() => cancelUpload(it.id)}
                                                className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"
                                            >
                                                {locale.cancel}
                                            </button>
                                        )}

                                        {uploadUrl && it.status === "error" && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    // reset to queued and upload this file only
                                                    setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, status: "queued", progress: 0 } : p)));
                                                    const only = items.filter((p) => p.id === it.id);
                                                    const prevItems = items; // capture
                                                    (async () => {
                                                        await Promise.all(
                                                            only.map(async (one) => {
                                                                await new Promise<void>((resolve) => {
                                                                    const form = new FormData();
                                                                    form.append(uploadFieldName || "file", one.file, one.file.name);
                                                                    if (uploadExtraData) {
                                                                        Object.entries(uploadExtraData).forEach(([k, v]) => form.append(k, String(v)));
                                                                    }
                                                                    const xhr = new XMLHttpRequest();
                                                                    xhr.open("POST", uploadUrl!);
                                                                    if (uploadHeaders) {
                                                                        Object.entries(uploadHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v));
                                                                    }
                                                                    xhr.upload.onprogress = (ev) => {
                                                                        if (ev.lengthComputable) {
                                                                            const p = Math.round((ev.loaded / ev.total) * 100);
                                                                            setItems((prev) => prev.map((pItem) => (pItem.id === one.id ? { ...pItem, progress: p, status: "uploading" } : pItem)));
                                                                        }
                                                                    };
                                                                    xhr.onreadystatechange = () => {
                                                                        if (xhr.readyState === 4) {
                                                                            const ok = xhr.status >= 200 && xhr.status < 300;
                                                                            setItems((prev) =>
                                                                                prev.map((pItem) =>
                                                                                    pItem.id === one.id
                                                                                        ? { ...pItem, status: ok ? "success" : "error", progress: ok ? 100 : pItem.progress, xhr: null }
                                                                                        : pItem
                                                                                )
                                                                            );
                                                                            resolve();
                                                                        }
                                                                    };
                                                                    setItems((prev) => prev.map((pItem) => (pItem.id === one.id ? { ...pItem, xhr, status: "uploading", progress: 0 } : pItem)));
                                                                    xhr.send(form);
                                                                });
                                                            })
                                                        );
                                                    })();
                                                }}
                                                className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"
                                            >
                                                {locale.retry}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => removeItem(it.id)}
                                            className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"
                                        >
                                            {locale.remove}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }
);
FilePicker.displayName = "FilePicker";

function Preview({ file, show }: { file: File; show: boolean }) {
    const url = useObjectUrl(show && isImage(file) ? file : undefined);
    return (
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border bg-white">
            {url ? (
                <img src={url} alt="preview" className="h-full w-full object-cover" />
            ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">
                    <FileIcon mime={file.type} />
                </div>
            )}
        </div>
    );
}

function ProgressBar({ progress, status }: { progress: number; status: Item["status"] }) {
    const isActive = status === "uploading";
    const isDone = status === "success";
    const isError = status === "error" || status === "canceled";
    return (
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
            <div
                className={cx(
                    "h-2 rounded-full transition-all",
                    isDone ? "bg-green-500" : isError ? "bg-red-500" : "bg-blue-500"
                )}
                style={{ width: `${progress}%` }}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                role="progressbar"
            />
        </div>
    );
}

function FileIcon({ mime }: { mime: string }) {
    // very minimal mime grouping for icon hint
    const base = "M6 2h6l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z";
    const line = "M8 12h8M8 16h8M8 8h4";
    const img = "M8 14l2-2 2 2 3-3 3 3";
    const isImg = mime.startsWith("image/");
    const isPdf = mime === "application/pdf";
    const isZip = /zip|compressed/.test(mime);
    return (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" strokeWidth="1.5" stroke="currentColor">
            <path d={base} />
            <path d={isImg ? img : line} />
            {isPdf && <text x="8" y="12" fontSize="6">PDF</text>}
            {isZip && <text x="8" y="12" fontSize="6">ZIP</text>}
        </svg>
    );
}

// ——————————————————————————————————————————————————————————————
// QUICK USAGE (app/page.tsx or any client component)
//
// import { FilePicker, FilePickerRef } from "@/components/FilePicker";
//
// export default function Page() {
//   const pickerRef = React.useRef<FilePickerRef>(null);
//   return (
//     <div className="mx-auto max-w-xl p-6">
//       <h1 className="mb-4 text-2xl font-semibold">Upload files</h1>
//       <FilePicker
//         ref={pickerRef}
//         accept="image/*,.pdf"
//         maxFiles={5}
//         maxFileSize={10 * 1024 * 1024}
//         maxTotalSize={50 * 1024 * 1024}
//         uploadUrl="/api/upload" // OPTIONAL: if you want built-in upload
//         autoUpload
//         uploadHeaders={{ Authorization: "Bearer demo" }}
//         uploadExtraData={{ folder: "inbox" }}
//         onUploadComplete={(results) => console.log(results)}
//       />
//     </div>
//   );
// }
//
// ——————————————————————————————————————————————————————————————
// Minimal Next.js App Router API to receive uploads (multipart)
//   File: app/api/upload/route.ts
//
// import { NextResponse } from "next/server";
// export async function POST(req: Request) {
//   const form = await req.formData();
//   const file = form.get("file"); // matches uploadFieldName
//   // TODO: persist file (e.g., S3, Cloud Storage, fs)
//   // For demo, just echo metadata
//   if (!(file instanceof File)) {
//     return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
//   }
//   return NextResponse.json({ ok: true, name: file.name, size: file.size, type: file.type });
// }
//
// ——————————————————————————————————————————————————————————————
// Accessibility notes:
// - Dropzone is keyboard-activatable (Enter/Space)
// - Buttons have clear labels and focus styles
// - Progress bars expose aria attributes
// ——————————————————————————————————————————————————————————————
