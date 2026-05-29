import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseEnabled } from "./check";

/**
 * 安全创建 Supabase 服务端客户端
 * - 环境变量缺失或无效 → 返回 null（不抛出）
 */
export async function createServerSupabase() {
  if (!isSupabaseEnabled()) return null;

  const cookieStore = await cookies();

  try {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      },
    );
  } catch (e) {
    console.error("[Supabase] createServerSupabase failed:", e);
    return null;
  }
}
