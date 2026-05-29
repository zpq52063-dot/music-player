"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconMusic, IconSettings } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "发现", icon: IconHome },
    { href: "/library", label: "我的", icon: IconMusic },
    { href: "/settings", label: "设置", icon: IconSettings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-surface/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-md">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-accent-primary" : "text-text-tertiary",
              )}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
