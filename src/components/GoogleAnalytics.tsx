'use client';

import Script from 'next/script';

/**
 * Google Analytics 4 (GA4) コンポーネント
 * 
 * @description
 * Google Analyticsのトラッキングコードを読み込みます。
 * 開発環境（devモード）では無効化されます。
 */
export default function GoogleAnalytics() {
  // 開発環境の判定（devモードで確実に無効化）
  const isDevelopment = 
    process.env.NODE_ENV === 'development' || 
    (typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0'
    ));

  // 環境変数で明示的に無効化されている場合も無効化
  const isEnabled = process.env.NEXT_PUBLIC_GA_ENABLED !== 'false' && !isDevelopment;

  // 開発環境または明示的に無効化されている場合は何も表示しない
  if (!isEnabled) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA] 開発環境のため、Google Analyticsは無効化されています');
    }
    return null;
  }

  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-5KT9CTEE74';

  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            send_page_view: false
          });
        `}
      </Script>
    </>
  );
}

