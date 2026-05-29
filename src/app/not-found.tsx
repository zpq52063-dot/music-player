import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#0a0a0a" />
        <title>404 | Music</title>
      </head>
      <body className="antialiased">
        <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0a0a0a] px-6">
          <div className="text-center">
            <div className="mb-4 text-6xl font-bold text-text-primary">404</div>
            <p className="mb-8 text-base text-text-secondary">页面未找到</p>
            <Link
              href="/"
              className="inline-block rounded-apple-lg bg-accent-primary px-8 py-3 text-sm font-semibold text-white active:scale-[0.97] transition-transform"
            >
              返回首页
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
