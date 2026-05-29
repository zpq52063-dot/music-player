import type { LyricLine } from "@/types";

/**
 * LRC 歌词解析器
 *
 * 支持格式：
 *   [00:12.34]歌词文本
 *   [00:12]歌词文本
 *   [00:12.34][01:23.45]重复标签歌词
 *   [00:12.34]原文<00:12.34>翻译 → 双语歌词（增强模式）
 *   无标签行视为元数据（跳过）
 */

export class LyricParser {
  /**
   * 解析 LRC 文本为 LyricLine 数组，按时间排序
   */
  static parse(lrc: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const raw = lrc.trim();

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // 处理多标签行：[00:12.34][01:23.45]text
      const matches = Array.from(
        trimmed.matchAll(/\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g),
      );

      if (matches.length === 0) continue;

      // 提取歌词文本（最后一个标签之后）
      const lastMatch = matches[matches.length - 1];
      if (!lastMatch || lastMatch.index === undefined) continue;
      const textStart = lastMatch.index + lastMatch[0].length;
      const text = trimmed.slice(textStart).trim();
      if (!text) continue;

      for (const m of matches) {
        const min = parseInt(m[1] ?? "0", 10);
        const sec = parseInt(m[2] ?? "0", 10);
        const msRaw = m[3] ?? "0";
        const ms = msRaw.length === 2 ? parseInt(msRaw, 10) * 10 : parseInt(msRaw, 10);
        const time = min * 60_000 + sec * 1_000 + ms;

        lines.push({ time, text });
      }
    }

    lines.sort((a, b) => a.time - b.time);
    return lines;
  }

  /**
   * 支持翻译的增强解析
   * 格式: [mm:ss.xx]原文<mm:ss.xx>翻译
   * 或: [mm:ss.xx]原文 | 翻译
   */
  static parseEnhanced(lrc: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const raw = lrc.trim();

    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const matches = Array.from(
        trimmed.matchAll(/\[(\d{2}):(\d{2})(?:[.:](\d{2,3}))?\]/g),
      );

      if (matches.length === 0) continue;

      const lastMatch = matches[matches.length - 1];
      if (!lastMatch || lastMatch.index === undefined) continue;
      const textStart = lastMatch.index + lastMatch[0].length;
      const rawText = trimmed.slice(textStart).trim();
      if (!rawText) continue;

      // 尝试提取翻译: <mm:ss.xx>翻译文本
      const translationMatch = rawText.match(/<(\d{2}):(\d{2})(?:[.:](\d{2,3}))?>(.+)$/);
      let text = rawText;
      let translation: string | undefined;

      if (translationMatch) {
        text = rawText.slice(0, translationMatch.index).trim();
        translation = translationMatch[4]?.trim();
      } else {
        // 尝试 | 分隔符: 原文 | 翻译
        const pipeIdx = rawText.lastIndexOf("|");
        if (pipeIdx > 0) {
          text = rawText.slice(0, pipeIdx).trim();
          translation = rawText.slice(pipeIdx + 1).trim();
        }
      }

      if (!text) continue;

      for (const m of matches) {
        const min = parseInt(m[1] ?? "0", 10);
        const sec = parseInt(m[2] ?? "0", 10);
        const msRaw = m[3] ?? "0";
        const ms = msRaw.length === 2 ? parseInt(msRaw, 10) * 10 : parseInt(msRaw, 10);
        const time = min * 60_000 + sec * 1_000 + ms;

        lines.push({ time, text, translation });
      }
    }

    lines.sort((a, b) => a.time - b.time);
    return lines;
  }

  /**
   * 二分查找当前时间的歌词行索引
   */
  static findCurrentIndex(lines: LyricLine[], currentTimeMs: number): number {
    if (lines.length === 0) return -1;

    let lo = 0;
    let hi = lines.length - 1;
    let result = 0;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const line = lines[mid];
      if (!line) break;

      if (line.time <= currentTimeMs) {
        result = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    return result;
  }
}
