import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseEnabled } from "./check";

/**
 * 安全创建 Supabase 浏览器客户端
 * - 环境变量缺失或无效 → 返回 null（不抛出）
 * - 即使 createBrowserClient 内部抛出 → 也 catch 返回 null
 */
export function safeCreateClient() {
  if (!isSupabaseEnabled()) return null;

  try {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
  } catch (e) {
    console.error("[Supabase] safeCreateClient failed:", e);
    return null;
  }
}

/** @deprecated 使用 safeCreateClient() */
export const createClient = safeCreateClient;
