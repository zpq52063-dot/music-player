"use client";

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";

interface LazyImageProps {
  src: string;
  alt: string;
  size?: number;
  width?: number;
  height?: number;
  className?: string;
  rounded?: "md" | "lg" | "full";
  priority?: boolean;
}

const roundedMap = { md: "rounded-apple", lg: "rounded-apple-lg", full: "rounded-full" } as const;

export function LazyImage({ src, alt, size, width, height, className, rounded = "md", priority = false }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const w = width ?? size ?? 48;
  const h = height ?? size ?? 48;

  return (
    <div className={clsx("relative overflow-hidden", roundedMap[rounded], !loaded && "skeleton", className)} style={{ width: w, height: h }}>
      {!error && (
        <Image
          src={src}
          alt={alt}
          width={w}
          height={h}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={clsx("object-cover transition-opacity duration-500", roundedMap[rounded], loaded ? "opacity-100" : "opacity-0")}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          sizes={`${w}px`}
        />
      )}
      {error && (
        <div className="flex h-full w-full items-center justify-center bg-surface text-text-tertiary">
          <svg className="h-1/3 w-1/3" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        </div>
      )}
    </div>
  );
}
