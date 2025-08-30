import React, { forwardRef } from "react";
import clsx from "clsx";
import Link, { type LinkProps } from "next/link";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  childrenClass?: string;
};

type NextHref = LinkProps["href"];

type ButtonAsButton = CommonProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> & {
    as?: "button";
    disabled?: boolean;
  };

type ButtonAsLink = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> & {
    as: "a";
    href: NextHref; // <-- definitive, not optional
    disabled?: boolean;
    onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function baseClasses(isDisabled: boolean) {
  return clsx(
    "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap",
    "rounded-xl font-semibold",
    "transition-colors duration-200 ease-out active:translate-y-px",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    isDisabled && "opacity-60 pointer-events-none"
  );
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500",
  secondary: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700",
  outline: "bg-white text-slate-900 border border-slate-300 hover:bg-slate-100 focus-visible:ring-slate-400",
  ghost: "bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      as = "button",
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      childrenClass = "",
      ...rest
    } = props as ButtonProps & { children?: React.ReactNode };

    const disabledProp = "disabled" in props ? !!props.disabled : false;
    const isDisabled = disabledProp || loading;

    const classes = clsx(
      baseClasses(isDisabled),
      variantClasses[variant],
      sizeClasses[size],
      loading && "data-[loading=true]:opacity-90",
      className
    );

    const Spinner = (
      <span
        className={clsx(
          "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent",
          size === "lg" && "h-5 w-5",
          size === "sm" && "h-3.5 w-3.5"
        )}
        aria-hidden="true"
      />
    );

    // LINK VARIANT
    if (as === "a") {
      const { href, onClick, ...anchorRest } = rest as Omit<ButtonAsLink, keyof CommonProps | "as"> & {
        href: NextHref;
      };

      const isExternal =
        typeof href === "string" && /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href);

      const handleClick: React.MouseEventHandler<HTMLAnchorElement> = (e) => {
        if (isDisabled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        onClick?.(e);
      };

      // External links → plain <a>
      if (isExternal) {
        return (
          <a
            {...(anchorRest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
            href={href as string}
            ref={ref as React.Ref<HTMLAnchorElement>}
            className={classes}
            aria-disabled={isDisabled || undefined}
            aria-busy={loading || undefined}
            onClick={handleClick}
            tabIndex={isDisabled ? -1 : anchorRest.tabIndex}
            data-loading={loading || undefined}
          >
            {loading && Spinner}
            {leftIcon && <span className="-ml-0.5">{leftIcon}</span>}
            <span className={clsx("inline-flex items-center", childrenClass)}>{children}</span>
            {rightIcon && <span className="-mr-0.5">{rightIcon}</span>}
            {loading && <span className="sr-only">Loading</span>}
          </a>
        );
      }

      // Internal links → Next <Link>
      return (
        <Link
          href={href} // <-- definite Url
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-disabled={isDisabled || undefined}
          aria-busy={loading || undefined}
          onClick={handleClick}
          tabIndex={isDisabled ? -1 : (anchorRest as any).tabIndex}
          data-loading={loading || undefined}
          {...(anchorRest as Record<string, any>)}
        >
          {loading && Spinner}
          {leftIcon && <span className="-ml-0.5">{leftIcon}</span>}
          <span className={clsx("inline-flex items-center", childrenClass)}>{children}</span>
          {rightIcon && <span className="-mr-0.5">{rightIcon}</span>}
          {loading && <span className="sr-only">Loading</span>}
        </Link>
      );
    }

    // BUTTON VARIANT
    const buttonProps = rest as React.ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <button
        {...buttonProps}
        ref={ref as React.Ref<HTMLButtonElement>}
        type={buttonProps.type ?? "button"}
        className={classes}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        data-loading={loading || undefined}
      >
        {loading && Spinner}
        {leftIcon && <span className="-ml-0.5">{leftIcon}</span>}
        <span className={clsx("inline-flex items-center", childrenClass)}>{children}</span>
        {rightIcon && <span className="-mr-0.5">{rightIcon}</span>}
        {loading && <span className="sr-only">Loading</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
