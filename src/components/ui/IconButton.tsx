"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "filled";
}

const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" } as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "md", variant = "ghost", className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center rounded-full transition-all duration-200 active:scale-90",
        sizeMap[size],
        variant === "ghost" && "text-text-primary hover:bg-white/10",
        variant === "filled" && "bg-white/10 text-text-primary hover:bg-white/20",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = "IconButton";
