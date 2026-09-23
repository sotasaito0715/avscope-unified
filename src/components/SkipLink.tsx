/**
 * スキップリンクコンポーネント
 * 
 * @description
 * キーボードナビゲーションとスクリーンリーダー対応のためのスキップリンクを提供します。
 */

import Link from '@/components/ui/Link';

export default function SkipLink() {
  return (
    <>
      {/* メインコンテンツへのスキップリンク */}
      <Link
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        メインコンテンツにスキップ
      </Link>
      
      {/* 検索フォームへのスキップリンク */}
      <Link
        href="#search-form"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        検索フォームにスキップ
      </Link>
      
      {/* ナビゲーションへのスキップリンク */}
      <Link
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-64 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        ナビゲーションにスキップ
      </Link>
    </>
  );
}
