// components/Breadcrumbs.tsx
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type ClassNames = Partial<{
  container: string;
  list: string;
  item: string;
  link: string;
  current: string;
  separator: string;
}>;

type ResolveLabel =
  | ((segment: string, index: number, href: string) => Promise<React.ReactNode> | React.ReactNode)
  | undefined;

export type BreadcrumbsProps = {
  /** Text/icon for the root link ("/"). Hide by setting `hideRoot` */
  rootLabel?: React.ReactNode;
  /** Hide the root ("/") item — useful if your header already has "Home" */
  hideRoot?: boolean;
  /** Replace the default chevron */
  separator?: React.ReactNode;

  /** Map segment or full path → label. e.g., { "students": "Students", "/students": "Students" } */
  labels?: Record<string, React.ReactNode>;
  /**
   * Optional transformer for fallback labels (runs if no entry in `labels`).
   * Default: Title-case (hyphens -> spaces)
   */
  transformLabel?: (segment: string, index: number, parts: string[]) => React.ReactNode;
  /**
   * Optional async/sync resolver (runs last) — perfect for dynamic IDs (e.g., /students/123 -> "Alice Johnson")
   * Return `null`/`undefined` to keep previous label.
   */
  resolveLabel?: ResolveLabel;

  /** Title-case the default labels (disabled if you set `transformLabel`) */
  capitalize?: boolean;

  /** Tailwind slots */
  classNames?: ClassNames;

  /** Hide when on "/" */
  hideOnRoot?: boolean;
};

function defaultTransform(segment: string) {
  const pretty = decodeURIComponent(segment).replace(/-/g, " ").trim();
  return pretty
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function Breadcrumbs({
  rootLabel = "Home",
  hideRoot = false,
  separator,
  labels,
  transformLabel,
  resolveLabel,
  capitalize = true,
  classNames,
  hideOnRoot = false,
}: BreadcrumbsProps) {
  const pathname = usePathname() || "/";
  const rawParts = pathname.split("/").filter(Boolean);
  const parts = rawParts; // already decoded later for label

  // early exit if root and hidden
  if (hideOnRoot && parts.length === 0) return null;

  // Build cumulative hrefs
  const crumbs = React.useMemo(() => {
    const acc: { href: string; segment: string; keyFull: string }[] = [];
    let href = "";
    for (let i = 0; i < parts.length; i++) {
      const seg = parts[i];
      href += `/${seg}`;
      acc.push({ href, segment: seg, keyFull: href });
    }
    return acc;
  }, [parts]);

  // State for async label resolutions (per full path)
  const [resolved, setResolved] = React.useState<Record<string, React.ReactNode>>({});

  // Run async/sync resolver if provided
  React.useEffect(() => {
    if (!resolveLabel) return;

    let cancelled = false;
    (async () => {
      const updates: Record<string, React.ReactNode> = {};

      for (let i = 0; i < crumbs.length; i++) {
        const { href, segment } = crumbs[i];
        try {
          const maybe = await resolveLabel(segment, i, href);
          if (maybe !== undefined && maybe !== null) {
            updates[href] = maybe;
          }
        } catch {
          // ignore resolver errors silently
        }
      }

      if (!cancelled && Object.keys(updates).length) {
        setResolved((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [crumbs, resolveLabel]);

  const Chevron =
    separator ?? (
      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M7.05 4.55a1 1 0 011.4 0l4 4a1 1 0 010 1.4l-4 4a1 1 0 11-1.4-1.4L9.88 10 7.05 7.15a1 1 0 010-1.4z" />
      </svg>
    );

  const baseLabel = (seg: string, i: number) => {
    const mapped = labels?.[seg] ?? labels?.[`/${parts.slice(0, i + 1).join("/")}`];
    if (mapped) return mapped;
    const t = transformLabel ? transformLabel(seg, i, parts) : capitalize ? defaultTransform(seg) : seg;
    return t;
  };

  const items = [
    // Root ("/")
    ...(!hideRoot
      ? [
          {
            href: "/",
            label: labels?.["/"] ?? rootLabel,
          },
        ]
      : []),
    // Segments
    ...crumbs.map((c, i) => {
      const labelFromBase = baseLabel(c.segment, i);
      const label = resolved[c.href] ?? labelFromBase;
      return { href: c.href, label };
    }),
  ];

  // If you hid root and there are no parts, nothing to render
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={clsx("w-full", classNames?.container)}>
      <ol className={clsx("flex items-center gap-1 text-sm text-slate-500", classNames?.list)}>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={item.href} className={clsx("flex items-center", classNames?.item)}>
              {idx > 0 && <span className={clsx("mx-1", classNames?.separator)}>{Chevron}</span>}

              {isLast ? (
                <span
                  aria-current="page"
                  className={clsx("truncate max-w-[14rem] text-slate-700", classNames?.current)}
                  title={String(item.label)}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={clsx(
                    "truncate max-w-[14rem] hover:text-slate-700 underline-offset-2 hover:underline",
                    classNames?.link
                  )}
                  title={String(item.label)}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
