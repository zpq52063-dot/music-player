"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { clsx } from "clsx";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "default" | "heavy";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const variants = {
  light: "glass-light",
  default: "glass",
  heavy: "glass-heavy",
} as const;

const paddings = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
} as const;

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ variant = "default", interactive = false, padding = "md", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(variants[variant], paddings[padding], "rounded-apple-lg", interactive && "card", className)}
      {...props}
    >
      {children}
    </div>
  ),
);

GlassCard.displayName = "GlassCard";
