"use client";

import { memo } from "react";
import { clsx } from "clsx";
import { LazyImage } from "@/components/ui/LazyImage";

interface AlbumCoverProps {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  isPlaying?: boolean;
  className?: string;
}

const sizes = { sm: 48, md: 56, lg: 200, xl: 280 } as const;

export const AlbumCover = memo(function AlbumCover({
  src,
  alt,
  size = "sm",
  isPlaying = false,
  className,
}: AlbumCoverProps) {
  const px = sizes[size];
  const isLarge = size === "lg" || size === "xl";

  return (
    <div
      className={clsx("relative shrink-0", isLarge && "mx-auto", className)}
      style={isLarge ? undefined : { width: px, height: px }}
    >
      {isLarge ? (
        <div className="relative" style={{ width: px, height: px }}>
          {/* 旋转封面 — GPU 加速，animation-play-state 控制暂停/播放 */}
          <div
            className="h-full w-full"
            style={{
              animation: isPlaying ? "spin 12s linear infinite" : "none",
              willChange: "transform",
              WebkitTransform: "translateZ(0)",
            }}
          >
            <LazyImage
              src={src || "/icons/icon-192.png"}
              alt={alt}
              width={px}
              height={px}
              rounded="full"
            />
          </div>
          {/* 中间圆孔 — 唱片效果 */}
          <div className="absolute inset-0 m-auto h-10 w-10 rounded-full bg-background shadow-inner" />
        </div>
      ) : (
        /* 小尺寸 — 同样用 animation 控制旋转状态 */
        <div
          style={{
            animation: isPlaying ? "spin 8s linear infinite" : "none",
            willChange: "transform",
            WebkitTransform: "translateZ(0)",
            width: px,
            height: px,
          }}
        >
          <LazyImage
            src={src || "/icons/icon-192.png"}
            alt={alt}
            size={px}
            rounded="md"
          />
        </div>
      )}
    </div>
  );
});
