"use client";

import { useRouter } from "next/navigation";
import { IconSparkles } from "@tabler/icons-react";

export function ForYouEntryCard() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/foryou")}
      className="w-full rounded-apple-xl p-4 text-left text-white transition-all active:scale-[0.98]"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <IconSparkles size={20} />
        </div>
        <div>
          <p className="text-base font-semibold">为你推荐</p>
          <p className="text-xs text-white/70">基于你的听歌习惯</p>
        </div>
      </div>
    </button>
  );
}
