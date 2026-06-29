import React from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-[color:var(--cb-accent)] text-[color:var(--cb-accent-foreground)] hover:bg-[color:var(--cb-accent-hover)] active:bg-[color:var(--cb-accent-active)]",
  secondary:
    "border-[color:var(--cb-border)] bg-[color:var(--cb-surface)] text-[color:var(--cb-foreground)] hover:border-[color:var(--cb-accent)]/35 hover:bg-[color:var(--cb-elevated-surface)]",
  ghost:
    "border-transparent bg-transparent text-[color:var(--cb-foreground)] hover:bg-[color:var(--cb-surface)]",
  destructive:
    "border-transparent bg-[color:var(--cb-danger)] text-[color:var(--cb-accent-foreground)] hover:bg-[#9F3C3C] active:bg-[#872F2F]"
};

const baseClasses =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--cb-radius-md)] border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--cb-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--cb-background)] disabled:pointer-events-none disabled:opacity-[var(--cb-disabled-opacity)]";

type CommonProps = {
  className?: string;
  children: ReactNode;
  variant?: ButtonVariant;
};

export function Button({
  className,
  children,
  variant = "primary",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & CommonProps) {
  return (
    <button
      data-slot="button"
      className={cn(baseClasses, variantClasses[variant], className)}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  className,
  children,
  variant = "secondary",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & CommonProps & { href: string }) {
  return (
    <Link data-slot="button-link" className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      {children}
    </Link>
  );
}
