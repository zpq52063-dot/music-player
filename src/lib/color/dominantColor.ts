/**
 * 从图片 URL 提取主色调
 *
 * 策略: Canvas 缩小至 1×1 → 获取单像素颜色
 * 用于播放器全屏背景动态渐变
 */
export async function extractDominantColor(imageUrl: string): Promise<string | null> {
  try {
    const img = await loadImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, 1, 1);
    const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    return `rgb(${r},${g},${b})`;
  } catch {
    return null;
  }
}

/**
 * 从图片提取多个主要颜色（缩放到 50×50 采样）
 * 返回出现频率最高的 3 个颜色，按亮度排序（暗→亮）
 */
export async function extractColorPalette(imageUrl: string): Promise<string[]> {
  try {
    const img = await loadImage(imageUrl);
    const size = 50;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];

    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;

    const colorMap = new Map<string, number>();
    for (let i = 0; i < data.length; i += 4) {
      // 量化到 32 级减少噪音
      const r = Math.round(data[i]! / 32) * 32;
      const g = Math.round(data[i + 1]! / 32) * 32;
      const b = Math.round(data[i + 2]! / 32) * 32;
      const key = `${r},${g},${b}`;
      colorMap.set(key, (colorMap.get(key) ?? 0) + 1);
    }

    return Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([key]) => `rgb(${key})`);
  } catch {
    return [];
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}
