"use client";

import { Breadcrumbs } from "./Breadcrumbs";
import type { BreadcrumbsProps } from "./Breadcrumbs";

export default function BreadcrumbsClient(
    props: Omit<BreadcrumbsProps, "resolveLabel">
) {
    const resolveLabel: BreadcrumbsProps["resolveLabel"] = async (segment, _i, href) => {
        if (/^\d+$/.test(segment)) {
            return `ID ${segment}`;
        }
        return undefined;
    };

    return <Breadcrumbs {...props} resolveLabel={resolveLabel} />;
}
