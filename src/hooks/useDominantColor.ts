"use client";

import { useState, useEffect, useRef } from "react";
import { extractDominantColor } from "@/lib/color/dominantColor";

/**
 * 从歌曲封面提取主色调
 * 缓存结果避免重复提取
 */
const colorCache = new Map<string, string>();

export function useDominantColor(coverUrl: string | undefined): string | null {
  const [color, setColor] = useState<string | null>(null);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!coverUrl) {
      setColor(null);
      return;
    }

    const cached = colorCache.get(coverUrl);
    if (cached) {
      setColor(cached);
      return;
    }

    if (pendingRef.current) return;
    pendingRef.current = true;

    extractDominantColor(coverUrl).then((c) => {
      if (c) {
        colorCache.set(coverUrl, c);
      }
      setColor(c);
      pendingRef.current = false;
    }).catch(() => {
      pendingRef.current = false;
    });

    return () => {
      pendingRef.current = false;
    };
  }, [coverUrl]);

  return color;
}

/** 清除颜色缓存 */
export function clearColorCache(): void {
  colorCache.clear();
}
