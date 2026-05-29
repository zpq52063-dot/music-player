import { safeUUID } from "@/lib/safeUUID";

/**
 * Supabase 安全初始化层
 *
 * 规则：
 * - NEXT_PUBLIC_SUPABASE_URL 为空 OR 不是 http/https → 自动进入 local mode
 * - 决不允许 createClient("", "") 调用
 * - safeCreateClient() 是唯一入口，永不抛出
 */

// ==================== URL 验证 ====================

function isValidUrl(value: string | undefined): boolean {
  if (!value || typeof value !== "string") return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ==================== 实时检查（无缓存） ====================

export function isSupabaseEnabled(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return isValidUrl(url) && typeof key === "string" && key.length > 0;
}

// ==================== 兼容旧名 ====================

/** @deprecated 使用 isSupabaseEnabled() */
export const isSupabaseAvailable = isSupabaseEnabled;

// ==================== 本地用户 ID ====================

export function getLocalUserId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("local_user_id");
  if (!id) {
    id = "local_" + safeUUID();
    localStorage.setItem("local_user_id", id);
  }
  return id;
}
