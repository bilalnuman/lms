import clsx from "clsx";
import React, { type ReactNode } from "react";

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingProps
    extends Omit<React.HTMLAttributes<HTMLHeadingElement>, "title"> {
    as?: HeadingTag;
    title?: ReactNode;
    children?: ReactNode;
}

export default function Heading({
    as = "h3",
    title,
    children,
    className,
    ...rest
}: HeadingProps) {
    const Tag = as as HeadingTag;
    return (
        <Tag className={clsx("text-xl font-medium text-dark-default",className)} {...rest}>
            {title}
            {children}
        </Tag>
    );
}
