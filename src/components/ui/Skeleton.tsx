import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: number | string;
  height?: number | string;
}

export function Skeleton({ className, variant = "rectangular", width, height }: SkeletonProps) {
  return (
    <div
      className={clsx(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "h-4 w-full rounded",
        className,
      )}
      style={{ width, height }}
    />
  );
}

export function SongListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="rectangular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
}
