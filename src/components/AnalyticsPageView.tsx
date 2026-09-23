'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { trackPageView } from '@/lib/analytics';

/**
 * ページビュートラッキングの内部実装
 */
const AnalyticsPageViewInner = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;

    // クエリパラメータを含めた完全なパスを構築
    const search = searchParams?.toString();
    const pathWithSearch = search ? `${pathname}?${search}` : pathname;

    // ページタイトルを取得（document.titleが利用可能な場合）
    const pageTitle = typeof document !== 'undefined' ? document.title : undefined;

    trackPageView(pathWithSearch, pageTitle);
  }, [pathname, searchParams]);

  // このコンポーネントは何もレンダリングしない
  return null;
};

/**
 * Next.js App Routerのナビゲーションを監視し、ページビューをGA4に送信するコンポーネント
 * 
 * @description
 * usePathnameとuseSearchParamsを使用してルート変更を検知し、
 * 各ページ遷移時にtrackPageViewを呼び出します。
 * 初回マウント時とルート変更のたびにページビューが送信されます。
 * 
 * useSearchParams()を使用するため、Suspenseバウンダリでラップされています。
 */
const AnalyticsPageView = () => {
  return (
    <Suspense fallback={null}>
      <AnalyticsPageViewInner />
    </Suspense>
  );
};

export default AnalyticsPageView;

