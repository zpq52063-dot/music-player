"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary/10">
        <svg className="h-8 w-8 text-accent-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold">出现了一些问题</h2>
      <button
        onClick={reset}
        className="rounded-apple bg-accent-primary px-6 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
      >
        重新加载
      </button>
    </div>
  );
}
