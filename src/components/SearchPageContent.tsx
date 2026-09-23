'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import SearchResults from '@/components/SearchResults';
import Breadcrumbs from '@/components/Breadcrumbs';
import RandomAd from '@/components/RandomAd';
import { LoadingSpinner } from '@/components/ui/Loading';

function SearchPageInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <>
      <Header />
      
      {/* パンくずリスト */}
      {query && (
        <Breadcrumbs
          items={[
            { label: `検索: ${query}`, href: `/search?q=${encodeURIComponent(query)}` }
          ]}
        />
      )}
      
      {/* モバイル用横長バナー（上部） */}
      <div className="lg:hidden w-full px-4 pt-4 pb-0 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <RandomAd 
            placement="banner"
            className="flex justify-center"
          />
        </div>
      </div>
      
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-8">
          {!query ? (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-100 mb-4">
                検索キーワードを入力してください
              </h1>
              <p className="text-gray-400">
                ヘッダーの検索フォームからキーワードを入力して検索してください。
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* メインコンテンツ */}
              <div className="lg:col-span-3">
                {/* 完全CSRコンポーネント */}
                <SearchResults />

                {/* モバイル用横長バナー（コンテンツ中間） */}
                <div className="lg:hidden w-full py-6">
                  <RandomAd 
                    placement="banner"
                    className="flex justify-center"
                  />
                </div>
              </div>
              
              {/* サイドバー: 広告（PCのみ） */}
              <aside className="lg:col-span-1 hidden lg:block">
                <div className="sticky top-8 space-y-6">
                  <RandomAd 
                    placement="sidebar"
                    className="flex justify-center"
                  />
                  <RandomAd 
                    placement="sidebar"
                    className="flex justify-center"
                  />
                </div>
              </aside>
            </div>
          )}
        </div>

        {/* モバイル用横長バナー（下部） */}
        <div className="lg:hidden w-full px-4 py-4 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
            <RandomAd 
              placement="banner"
              className="flex justify-center"
            />
          </div>
        </div>
      </main>
    </>
  );
}

export default function SearchPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner message="読み込み中..." />
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}

