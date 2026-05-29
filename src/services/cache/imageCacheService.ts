// ==================== Image Preload ====================

const preloadedUrls = new Set<string>();

export function preloadImage(url: string): Promise<void> {
  if (preloadedUrls.has(url)) return Promise.resolve();

  return new Promise<void>((resolve) => {
    if (typeof Image === "undefined") {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => {
      preloadedUrls.add(url);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = url;
  });
}

export async function preloadImages(urls: string[]): Promise<void> {
  await Promise.allSettled(urls.map((url) => preloadImage(url)));
}

export function isImagePreloaded(url: string): boolean {
  return preloadedUrls.has(url);
}

export function clearPreloadCache(): void {
  preloadedUrls.clear();
}
