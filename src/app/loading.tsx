export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent-primary opacity-80" />
        <div
          className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-white/20"
          style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
        />
      </div>
    </div>
  );
}
