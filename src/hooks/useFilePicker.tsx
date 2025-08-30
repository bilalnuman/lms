"use client";
/* eslint-disable @next/next/no-img-element */
import * as React from "react";

// -----------------------------------------------------------------------------
// useFilePicker — hook + lightweight UI primitives (DragAndDropArea, RenderFiles)
// Matches the API you asked for while adding drag/drop, paste, previews,
// validation, and customizable styling via options.
// File: components/useFilePicker.tsx
// -----------------------------------------------------------------------------

export interface DragAndDropAreaProps {
  children?: React.ReactNode;
  Icon?: React.ReactNode;
}

export interface RenderFilesProps {
  Icon?: React.ReactNode;
  watermark?: boolean;
}

export type UseFilePickerOptions = {
  accept?: string | string[]; // e.g. "image/*,.pdf"
  multiple?: boolean; // if false, returns single file + url
  maxFiles?: number; // Infinity for no limit
  maxFileSize?: number; // per-file in bytes
  maxTotalSize?: number; // total in bytes
  allowPaste?: boolean; // paste images/files
  dedupe?: boolean; // ignore same file (name+size+mtime)
  onChange?: (files: File[]) => void;
  onError?: (message: string, file?: File) => void;
  classes?: {
    dragArea?: {
      label?: string;
      input?: string;
      zone?: string;
      icon?: string;
      title?: string;
      subtitle?: string;
      children?: string;
      dragging?: string; // applied when dragging
      disabled?: string; // applied when disabled
    };
    files?: {
      container?: string;
      item?: string;
      image?: string;
      removeButton?: string;
      watermark?: string;
      meta?: string;
    };
  };
};

type BaseReturn = {
  addFiles: (files: File[] | FileList) => void;
  removeAt: (index: number) => void;
  clear: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isDragging: boolean;
  DragAndDropArea: React.FC<DragAndDropAreaProps>;
  RenderFiles: React.FC<RenderFilesProps>;
};

export type UseFilePickerReturnMulti = BaseReturn & {
  selected: File[];
  fileUrls: string[];
};

export type UseFilePickerReturnSingle = BaseReturn & {
  selected: File | undefined;
  fileUrl: string | undefined;
};

export type UseFilePickerReturn<M extends boolean> = M extends true
  ? UseFilePickerReturnMulti
  : UseFilePickerReturnSingle;

// ----------------------------- utils -----------------------------------------
const toArray = (v?: string | string[]) =>
  !v ? [] : Array.isArray(v) ? v : v.split(",").map((s) => s.trim());

const formatBytes = (bytes: number) => {
  if (!isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let i = -1;
  do {
    bytes = bytes / 1024;
    i++;
  } while (bytes >= 1024 && i < units.length - 1);
  return `${bytes.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

const fileKey = (f: File) => `${f.name}-${f.size}-${f.lastModified}`;
const isImage = (f: File) => f.type.startsWith("image/");

const acceptMatches = (file: File, acceptList: string[]) => {
  if (acceptList.length === 0) return true;
  const mime = file.type.toLowerCase();
  const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
  return acceptList.some((rule) => {
    const r = rule.toLowerCase();
    if (r.startsWith(".")) return r === ext; // .png
    if (r.endsWith("/*")) return mime.startsWith(r.slice(0, -1)); // image/*
    return mime === r; // exact mime
  });
};

// ----------------------------- hook ------------------------------------------
export default function useFilePicker<M extends boolean = true>(
  options: UseFilePickerOptions & { multiple?: M } = {} as any
): UseFilePickerReturn<M> {
  const {
    accept,
    multiple = true,
    maxFiles = Infinity,
    maxFileSize = Infinity,
    maxTotalSize = Infinity,
    allowPaste = true,
    dedupe = true,
    onChange,
    onError,
    classes,
  } = options;

  // single-mode detection (runtime)
  const isSingle = options.multiple === false;

  const inputRef = React.useRef<HTMLInputElement>(null);
  const [selected, setSelected] = React.useState<File[]>([]);
  const [isDragging, setIsDragging] = React.useState(false);

  // computed
  const acceptList = React.useMemo(() => toArray(accept), [accept]);
  const totalSize = React.useMemo(() => selected.reduce((a, f) => a + f.size, 0), [selected]);

  // object URLs for previews
  const fileUrls = React.useMemo(() => selected.map((f) => URL.createObjectURL(f)), [selected]);
  React.useEffect(() => {
    return () => {
      // revoke on unmount or when selection changes (previous URLs GC'd by memo tear-down)
      fileUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fileUrls]);

  // helper: validate & add
  const addFiles = React.useCallback(
    (filesLike: File[] | FileList) => {
      const incoming = Array.from(filesLike);
      if (incoming.length === 0) return;

      setSelected((prev) => {
        // SINGLE MODE — replace selection with first valid file
        if (isSingle) {
          for (const f of incoming) {
            const errors: string[] = [];
            if (!acceptMatches(f, acceptList)) errors.push("File type not accepted");
            if (f.size > maxFileSize) errors.push(`File exceeds ${formatBytes(maxFileSize)}`);
            if (f.size > maxTotalSize) errors.push(`Total size exceeds ${formatBytes(maxTotalSize)}`);
            if (errors.length) {
              onError?.(errors.join(" · "), f);
              continue; // try next incoming (if any)
            }
            if (dedupe && prev[0] && fileKey(prev[0]) === fileKey(f)) return prev; // same file
            return [f]; // replace
          }
          return prev; // none valid
        }

        // MULTI MODE — append respecting limits
        const current = dedupe ? new Map(prev.map((f) => [fileKey(f), f])) : null;
        const next: File[] = [...prev];

        // enforce maxFiles
        const allowedCount = Math.max(0, maxFiles - prev.length);
        const take = incoming.slice(0, allowedCount);
        if (incoming.length > take.length) onError?.(`Maximum ${maxFiles} files allowed.`);

        // total size check (prospective)
        const incomingSize = take.reduce((a, f) => a + f.size, 0);
        if (totalSize + incomingSize > maxTotalSize) onError?.(`Total size exceeds ${formatBytes(maxTotalSize)}`);

        for (const f of take) {
          const errors: string[] = [];
          if (!acceptMatches(f, acceptList)) errors.push("File type not accepted");
          if (f.size > maxFileSize) errors.push(`File exceeds ${formatBytes(maxFileSize)}`);
          if (totalSize + f.size > maxTotalSize) errors.push(`Total size exceeds ${formatBytes(maxTotalSize)}`);
          if (errors.length) {
            onError?.(errors.join(" · "), f);
            continue;
          }
          if (dedupe && current?.has(fileKey(f))) continue;
          next.push(f);
        }
        return next;
      });
    },
    [acceptList, dedupe, isSingle, maxFiles, maxFileSize, maxTotalSize, onError, totalSize]
  );

  const removeAt = React.useCallback((index: number) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clear = React.useCallback(() => setSelected([]), []);

  // notify parent
  React.useEffect(() => onChange?.(selected), [selected, onChange]);

  // paste support
  React.useEffect(() => {
    if (!allowPaste) return;
    const handler = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files || []);
      if (files.length) addFiles(files);
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, [allowPaste, addFiles]);

  // input handler
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = ""; // allow re-select same file
  };

  // drag & drop handlers
  const prevent = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDragEnter = (e: React.DragEvent) => {
    prevent(e);
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    prevent(e);
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    prevent(e);
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files);
  };

  // ------------------------ UI components bound to this hook ------------------
  const DragAndDropArea: React.FC<DragAndDropAreaProps> = React.useMemo(() => {
    const Cmp: React.FC<DragAndDropAreaProps> = ({ children, Icon }) => (
      <label
        className={[
          "relative block cursor-pointer",
          classes?.dragArea?.label,
          isDragging && (classes?.dragArea?.dragging || ""),
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={Array.isArray(accept) ? accept.join(",") : accept}
          multiple={!isSingle}
          onChange={onInputChange}
          className={["sr-only", classes?.dragArea?.input].filter(Boolean).join(" ")}
        />
        <div
          onDragEnter={onDragEnter}
          onDragOver={prevent}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={[
            "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-6 text-center",
            classes?.dragArea?.zone,
            isDragging ? classes?.dragArea?.dragging : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className={["text-2xl", classes?.dragArea?.icon].filter(Boolean).join(" ")}>{Icon}</div>
          <div className={classes?.dragArea?.children}>
            <div className={["text-sm", classes?.dragArea?.title].filter(Boolean).join(" ")}>drag & drop</div>
            <div className={["text-xs opacity-60", classes?.dragArea?.subtitle].filter(Boolean).join(" ")}>
              allowed types: {(Array.isArray(accept) ? accept.join(", ") : accept) || "*"}
            </div>
            {children}
          </div>
        </div>
      </label>
    );
    return Cmp;
  }, [accept, classes?.dragArea, isDragging, isSingle]);

  const RenderFiles: React.FC<RenderFilesProps> = React.useMemo(() => {
    const Cmp: React.FC<RenderFilesProps> = ({ Icon, watermark }) => (
      <div className={classes?.files?.container}>
        {fileUrls.map((url, i) => (
          <div
            key={url}
            className={[
              "relative flex items-center gap-3 rounded-xl border p-3",
              classes?.files?.item,
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="h-16 w-16 overflow-hidden rounded-lg border bg-white">
              {isImage(selected[i]) ? (
                <img
                  src={url}
                  alt={selected[i]?.name || `file-${i}`}
                  className={["h-full w-full object-cover", classes?.files?.image]
                    .filter(Boolean)
                    .join(" ")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs opacity-60">
                  {selected[i]?.type || "file"}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{selected[i]?.name}</div>
              <div className={["text-xs opacity-60", classes?.files?.meta].filter(Boolean).join(" ")}>
                {formatBytes(selected[i]?.size || 0)} · {selected[i]?.type || ""}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeAt(i)}
              className={[
                "rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50",
                classes?.files?.removeButton,
              ]
                .filter(Boolean)
                .join(" ")}
              aria-label={`Remove ${selected[i]?.name || "file"}`}
            >
              {Icon ?? "X"}
            </button>

            {watermark && (
              <div
                className={[
                  "pointer-events-none absolute inset-0 flex items-end justify-end p-2 text-[10px] opacity-50",
                  classes?.files?.watermark,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="rounded bg-white/70 px-1 py-0.5">
                  {selected[i]?.name} · {formatBytes(selected[i]?.size || 0)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
    return Cmp;
  }, [classes?.files, fileUrls, removeAt, selected]);

  const base = {
    addFiles,
    removeAt,
    clear,
    inputRef,
    isDragging,
    DragAndDropArea,
    RenderFiles,
  } as BaseReturn;

  if (isSingle) {
    const single = {
      ...base,
      selected: selected[0],
      fileUrl: fileUrls[0],
    } as UseFilePickerReturnSingle;
    return single as unknown as UseFilePickerReturn<M>;
  }

  const multi = { ...base, selected, fileUrls } as UseFilePickerReturnMulti;
  return multi as unknown as UseFilePickerReturn<M>;
}

// -----------------------------------------------------------------------------
// Quick usage (single)
// -----------------------------------------------------------------------------
// const picker = useFilePicker({ multiple: false, accept: "image/*" });
// <picker.DragAndDropArea Icon={<span>📷</span>}>
//   {picker.fileUrl && (
//     <img key={picker.fileUrl} src={picker.fileUrl} alt="preview" className="w-32 h-32 object-cover" />
//   )}
// </picker.DragAndDropArea>
// -----------------------------------------------------------------------------
