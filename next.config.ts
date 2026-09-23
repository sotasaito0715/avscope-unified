import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化を無効化（Vercel料金削減）
  images: {
    unoptimized: true,
    // Next.js 16対応: 使用する品質値を事前に定義
    qualities: [75, 80, 85, 90, 95],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.dmm.co.jp',
      },
      {
        protocol: 'https',
        hostname: '*.dmm.com',
      },
      {
        protocol: 'https',
        hostname: '*.fanza.com',
      },
      {
        protocol: 'http',
        hostname: 'pics.dmm.co.jp',
      },
      {
        protocol: 'https',
        hostname: 'pic.duga.jp',
      },
      {
        protocol: 'http',
        hostname: 'pic.duga.jp',
      },
      {
        protocol: 'https',
        hostname: 'affsample.duga.jp',
      },
    ],
  },
  // 開発時のキャッシュ問題を回避
  experimental: {
    // 開発サーバーの安定性を向上
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Client Router Cache: 回遊時の再フェッチを抑制（Origin Transfer / Function 削減）
    // 値を 0 にすると遷移のたびに RSC 再取得となりコスト増になる
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
  // 最適化されたキャッシュ戦略とセキュリティヘッダー
  async headers() {
    // セキュリティヘッダー（ミドルウェアからの移行）
    // ミドルウェアでヘッダーを変更するとISRキャッシュがバイパスされるため、
    // next.config.tsで設定する
    const securityHeaders = [
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://widget-view.dmm.com https://widget-view.dmm.co.jp https://vercel.live https://www.jpornmarket.com; " +
          "script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://widget-view.dmm.com https://widget-view.dmm.co.jp https://vercel.live https://www.jpornmarket.com; " +
          "style-src 'self' 'unsafe-inline' https://www.jpornmarket.com; " +
          "style-src-elem 'self' 'unsafe-inline' https://www.jpornmarket.com; " +
          "img-src 'self' data: https: http://pics.dmm.co.jp https://pics.dmm.co.jp http://*.dmm.co.jp https://*.dmm.co.jp http://pic.duga.jp https://pic.duga.jp https://mttag.com; " +
          "media-src 'self' https: http://affsample.duga.jp https://affsample.duga.jp https://www.jpornmarket.com; " +
          "connect-src 'self' http://affapi.duga.jp https://affapi.duga.jp https://shiroto.avscope.jp https://affiliate.dmm.com https://www.google-analytics.com https://analytics.google.com https://widget-view.dmm.com https://widget-view.dmm.co.jp https://widget-api.dmm.com https://widget-api.dmm.co.jp https://vercel.live https://www.jpornmarket.com https://www.dxlive.com; " +
          "frame-src 'self' https://www.dmm.co.jp https://*.dmm.co.jp https://al.dmm.co.jp https://widget-view.dmm.com https://widget-view.dmm.co.jp https://vercel.live https://www.jpornmarket.com https://rtcstatic.dxlive.com https://*.dxlive.com;",
      },
    ];

    return [
      // 静的アセット（画像、フォント、CSS、JS）: 長時間キャッシュ
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          ...securityHeaders,
        ],
      },
      {
        source: '/:path*\\.(ico|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          ...securityHeaders,
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          ...securityHeaders,
        ],
      },
      // 動的コンテンツ（HTML）: セキュリティヘッダーのみ
      // Cache-Control はページの export const revalidate（ISR）に任せる
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
