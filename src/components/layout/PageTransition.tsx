"use client";

import { useEffect, useState, useRef } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey?: string;
}

/**
 * Page transition wrapper — fade-in + slide-up on route change.
 * Uses CSS animation classes for GPU-accelerated transitions.
 */
export function PageTransition({ children, routeKey }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const prevKey = useRef(routeKey);

  useEffect(() => {
    if (prevKey.current !== routeKey) {
      setIsVisible(false);
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      prevKey.current = routeKey;
      return () => cancelAnimationFrame(frame);
    } else {
      setIsVisible(true);
    }
  }, [routeKey]);

  return (
    <div
      className={
        "transition-all duration-300 ease-out" +
        (isVisible ? " opacity-100 translate-y-0" : " opacity-0 translate-y-2")
      }
    >
      {children}
    </div>
  );
}
