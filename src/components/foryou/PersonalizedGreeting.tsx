"use client";

import { useUserStore } from "@/stores/userStore";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function PersonalizedGreeting() {
  const user = useUserStore((s) => s.user);
  const name = user?.username ?? "音乐爱好者";

  return (
    <div className="px-1">
      <p className="text-sm text-text-secondary">{getGreeting()}</p>
      <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
    </div>
  );
}
