"use client";

import { useState, useCallback } from "react";
import {
  IconChevronLeft,
  IconTrash,
  IconDatabase,
  IconCloud,
  IconMusic,
  IconBug,
  IconDownload,
  IconDeviceMobile,
  IconInfoCircle,
  IconRefresh,
  IconCheck,
  IconGripVertical,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useSettingsStore, type AudioQuality, type ProviderPriority } from "@/stores/settingsStore";
import { useSystemStore } from "@/stores/systemStore";
import { useOfflineCache } from "@/hooks/useOfflineCache";
import { getLogger } from "@/lib/logs";
import { clearRecoveryState } from "@/services/recovery/PlaybackRecoverySystem";
import { cn } from "@/lib/utils";

// ==================== Types ====================

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

// ==================== Sub-components ====================

function SettingSection({ title, children }: SettingSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-text-tertiary">
        {title}
      </h3>
      <div className="glass rounded-apple-lg">{children}</div>
    </div>
  );
}

function SettingRow({ icon, label, description, right, onClick, danger }: SettingRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 transition-colors",
        "border-b border-white/5 last:border-b-0",
        onClick && "active:bg-white/5",
        danger && "text-accent-primary",
      )}
    >
      <span className={cn("shrink-0", danger ? "text-accent-primary" : "text-text-secondary")}>
        {icon}
      </span>
      <div className="flex-1 text-left">
        <p className={cn("text-sm", danger ? "text-accent-primary" : "text-text-primary")}>
          {label}
        </p>
        {description && <p className="mt-0.5 text-xs text-text-tertiary">{description}</p>}
      </div>
      {right && <span className="shrink-0">{right}</span>}
    </button>
  );
}

// ==================== Settings Actions ====================

interface ClearCacheConfirmProps {
  onClose: () => void;
}

function ClearCacheConfirm({ onClose }: ClearCacheConfirmProps) {
  const [clearing, setClearing] = useState(false);

  const handleClear = useCallback(async () => {
    setClearing(true);
    try {
      // Clear IndexedDB
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) indexedDB.deleteDatabase(db.name);
      }
      // Clear localStorage (except auth)
      const authKeys = [
        "supabase.auth.token",
        "sb-" /* Supabase prefix */,
      ];
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !authKeys.some((ak) => key.startsWith(ak))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      // Clear recovery
      clearRecoveryState();
    } catch {
      // silently fail
    }
    setClearing(false);
    onClose();
    window.location.reload();
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="glass-heavy w-full max-w-sm rounded-apple-xl p-6">
        <h3 className="mb-2 text-lg font-semibold text-text-primary">清除所有缓存？</h3>
        <p className="mb-6 text-sm text-text-secondary">
          将清除所有离线歌曲、歌词缓存、搜索历史和设置。此操作不可撤销。
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="glass flex-1 rounded-apple-lg py-2.5 text-sm text-text-primary active:scale-95"
          >
            取消
          </button>
          <button
            onClick={handleClear}
            disabled={clearing}
            className="flex-1 rounded-apple-lg bg-accent-primary py-2.5 text-sm font-medium text-white active:scale-95 disabled:opacity-50"
          >
            {clearing ? "清除中..." : "确认清除"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Provider Priority Sort ====================

const PROVIDER_LABELS: Record<ProviderPriority, string> = {
  mock: "Mock (本地 Demo)",
};

interface ProviderSortModalProps {
  onClose: () => void;
}

function ProviderSortModal({ onClose }: ProviderSortModalProps) {
  const { providerPriority, setProviderPriority } = useSettingsStore();
  const [order, setOrder] = useState<ProviderPriority[]>([...providerPriority]);

  const moveUp = useCallback((index: number) => {
    if (index === 0) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
      return next;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setOrder((prev) => {
      if (index === prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1]!, next[index]!];
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    setProviderPriority(order);
    onClose();
  }, [order, setProviderPriority, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="glass-heavy w-full max-w-sm rounded-apple-xl p-6">
        <h3 className="mb-4 text-lg font-semibold text-text-primary">音源优先级</h3>
        <p className="mb-4 text-xs text-text-tertiary">
          拖拽调整优先级。排在最上面的音源优先使用。
        </p>
        <div className="mb-6 space-y-1">
          {order.map((p, i) => (
            <div
              key={p}
              className="glass flex items-center gap-3 rounded-apple px-3 py-2.5"
            >
              <IconGripVertical className="h-4 w-4 text-text-tertiary" />
              <span className="flex-1 text-sm text-text-primary">{PROVIDER_LABELS[p]}</span>
              <span className="text-xs text-text-tertiary">#{i + 1}</span>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="text-text-tertiary disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === order.length - 1}
                  className="text-text-tertiary disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="glass flex-1 rounded-apple-lg py-2.5 text-sm text-text-primary active:scale-95"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex-1 rounded-apple-lg bg-accent-secondary py-2.5 text-sm font-medium text-white active:scale-95"
          >
            <IconCheck className="mr-1 inline h-4 w-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Main Settings Page ====================

export function SettingsPage() {
  const router = useRouter();
  const settings = useSettingsStore();
  const system = useSystemStore();
  const { cacheStats } = useOfflineCache();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showProviderSort, setShowProviderSort] = useState(false);
  const logger = getLogger();

  const cacheTotal =
    (cacheStats?.metadataCount ?? 0) +
    (cacheStats?.offlinePlaylistCount ?? 0) +
    (cacheStats?.historyCount ?? 0) +
    (cacheStats?.lyricCount ?? 0);

  const audioQualityOptions: { value: AudioQuality; label: string }[] = [
    { value: "high", label: "高音质" },
    { value: "medium", label: "标准" },
    { value: "low", label: "省流量" },
  ];

  const handleRebuildIndex = useCallback(() => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  return (
    <div className="animate-fade-in pb-36 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 px-4">
        <button
          onClick={() => router.back()}
          className="glass rounded-full p-2 active:scale-90"
        >
          <IconChevronLeft className="h-5 w-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-semibold text-text-primary">设置</h1>
      </div>

      {/* Audio Section */}
      <div className="px-4">
        <SettingSection title="音频">
          <SettingRow
            icon={<IconMusic className="h-5 w-5" />}
            label="音频质量"
            description="选择在线播放的音质"
            right={
              <select
                value={settings.audioQuality}
                onChange={(e) => settings.setAudioQuality(e.target.value as AudioQuality)}
                className="glass rounded-apple border-0 px-2 py-1 text-sm text-text-primary"
              >
                {audioQualityOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            }
          />
          <SettingRow
            icon={<IconDownload className="h-5 w-5" />}
            label="自动缓存"
            description="播放时自动缓存歌曲到本地"
            right={
              <button
                onClick={() => settings.setAutoCache(!settings.autoCache)}
                className={cn(
                  "h-6 w-11 rounded-full transition-colors",
                  settings.autoCache ? "bg-accent-secondary" : "bg-white/20",
                )}
              >
                <span
                  className={cn(
                    "block h-5 w-5 rounded-full bg-white transition-transform",
                    settings.autoCache ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            }
          />
        </SettingSection>

        {/* Provider Section */}
        <SettingSection title="音源">
          <SettingRow
            icon={<IconCloud className="h-5 w-5" />}
            label="音源优先级"
            description="拖拽调整音源使用顺序"
            right={
              <span className="text-xs text-text-tertiary">
                {PROVIDER_LABELS[settings.providerPriority[0]!]}
              </span>
            }
            onClick={() => setShowProviderSort(true)}
          />
        </SettingSection>

        {/* Cache Section */}
        <SettingSection title="缓存">
          <SettingRow
            icon={<IconDatabase className="h-5 w-5" />}
            label="缓存数据"
            description={`${cacheTotal} 条缓存记录`}
            right={
              <span className="text-xs text-text-tertiary">
                歌曲{(cacheStats?.metadataCount ?? 0)} · 歌词{(cacheStats?.lyricCount ?? 0)}
              </span>
            }
          />
          <SettingRow
            icon={<IconRefresh className="h-5 w-5" />}
            label="重建索引"
            description="重建本地歌曲索引"
            onClick={handleRebuildIndex}
          />
          <SettingRow
            icon={<IconTrash className="h-5 w-5" />}
            label="清除所有缓存"
            description="清除离线歌曲、歌词和搜索历史"
            onClick={() => setShowClearConfirm(true)}
            danger
          />
        </SettingSection>

        {/* Debug Section */}
        <SettingSection title="开发">
          <SettingRow
            icon={<IconBug className="h-5 w-5" />}
            label="Debug 模式"
            description="启用调试日志和开发者面板"
            right={
              <button
                onClick={() => {
                  settings.setDebugMode(!settings.debugMode);
                  if (!settings.debugMode) {
                    logger.enableAll();
                  } else {
                    logger.disableAll();
                  }
                }}
                className={cn(
                  "h-6 w-11 rounded-full transition-colors",
                  settings.debugMode ? "bg-accent-secondary" : "bg-white/20",
                )}
              >
                <span
                  className={cn(
                    "block h-5 w-5 rounded-full bg-white transition-transform",
                    settings.debugMode ? "translate-x-[22px]" : "translate-x-0.5",
                  )}
                />
              </button>
            }
          />
        </SettingSection>

        {/* Info Section */}
        <SettingSection title="关于">
          <SettingRow
            icon={<IconDeviceMobile className="h-5 w-5" />}
            label="PWA 状态"
            description={
              system.installState.isStandalone
                ? "已安装 (独立窗口)"
                : system.installState.isInstalled
                  ? "已安装"
                  : "未安装"
            }
          />
          <SettingRow
            icon={<IconInfoCircle className="h-5 w-5" />}
            label="版本"
            description="长期维护版"
            right={<span className="text-xs text-text-tertiary">0.1.0</span>}
          />
        </SettingSection>
      </div>

      {/* Modals */}
      {showClearConfirm && <ClearCacheConfirm onClose={() => setShowClearConfirm(false)} />}
      {showProviderSort && <ProviderSortModal onClose={() => setShowProviderSort(false)} />}
    </div>
  );
}
