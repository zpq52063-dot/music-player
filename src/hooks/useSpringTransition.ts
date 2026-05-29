"use client";

import { useState, useCallback, useRef } from "react";

/**
 * iOS 风格 spring 过渡动画
 *
 * 使用自定义 spring 曲线 (stiffness=200, damping=20)
 * 通过 CSS transition + transform 实现弹性缓动
 */
const SPRING_EASING = "cubic-bezier(0.16, 1, 0.3, 1)";
const SPRING_DURATION = 400;

interface SpringOptions {
  stiffness?: number;
  damping?: number;
  mass?: number;
}

export function useSpringTransition(options?: SpringOptions) {
  const { damping = 20, mass = 1 } = options ?? {};
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animate = useCallback((callback: () => void) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setIsAnimating(true);
    callback();

    const naturalDuration = (mass / damping) * 1000 + 200;
    const duration = Math.min(Math.max(naturalDuration, 300), SPRING_DURATION);

    timerRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);
  }, [mass, damping]);

  const springStyle = {
    transition: `all ${SPRING_DURATION}ms ${SPRING_EASING}`,
    willChange: isAnimating ? "transform, opacity" : "auto" as const,
  };

  return { animate, isAnimating, springStyle, springEasing: SPRING_EASING };
}

export { SPRING_EASING, SPRING_DURATION };
