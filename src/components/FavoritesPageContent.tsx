'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import ItemCard from '@/components/ItemCard';
import ActressCard from '@/components/ActressCard';
import { fetchActressesByIds, fetchItemsByIds } from '@/lib/dmm-client';
import { convertActressInfo } from '@/lib/dmm-utils';
import { ActressInfo, DMMItem } from '@/types/dmm';
import { LoadingSpinner } from '@/components/ui/Loading';

/**
 * IDが作品IDか女優IDかを判定
 * 数字のみの場合は女優ID、それ以外は作品IDとして判定
 */
function isActressId(id: string): boolean {
  // 数字のみの場合は女優ID
  return /^\d+$/.test(id);
}

function FavoritesPageInner() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  
  const [items, setItems] = useState<DMMItem[]>([]);
  const [actresses, setActresses] = useState<ActressInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      if (!idsParam) {
        setIsLoading(false);
        return;
      }

      // IDを分割
      const ids = idsParam.split(',').filter(id => id.trim());

      if (ids.length === 0) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // IDを分類
        const itemIds: string[] = [];
        const actressIds: string[] = [];

        ids.forEach(id => {
          if (isActressId(id)) {
            actressIds.push(id);
          } else {
            itemIds.push(id);
          }
        });

        // 女優データと作品データを並列で取得（それぞれ1回ずつのAPIコール）
        const [actressData, itemData] = await Promise.all([
          actressIds.length > 0 ? fetchActressesByIds(actressIds) : Promise.resolve([]),
          itemIds.length > 0 ? fetchItemsByIds(itemIds) : Promise.resolve([]),
        ]);

        // 女優データを型変換
        const convertedActresses = actressData.map(actress => convertActressInfo(actress));

        setItems(itemData);
        setActresses(convertedActresses);
      } catch (err) {
        console.error('Error loading favorites:', err);
        setError('お気に入りの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    }

    loadFavorites();
  }, [idsParam]);

  const totalCount = items.length + actresses.length;

  // IDがない場合またはエラーの表示
  if (!idsParam) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a]">
          <Breadcrumbs
            items={[
              { label: '共有されたお気に入り', href: '/favorites' },
            ]}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-100 mb-4">
                お気に入りが見つかりませんでした
              </h1>
              <p className="text-gray-400">
                共有URLが正しくないか、お気に入りが削除された可能性があります。
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <Breadcrumbs
          items={[
            { label: '共有されたお気に入り', href: '/favorites' },
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">
              共有されたお気に入りリスト
            </h1>
            {isLoading ? (
              <p className="text-gray-400">読み込み中...</p>
            ) : error ? (
              <p className="text-red-400">{error}</p>
            ) : (
              <p className="text-gray-400">
                {totalCount}件のお気に入りが共有されています
                {items.length > 0 && actresses.length > 0 && (
                  <>（作品 {items.length}件、女優 {actresses.length}名）</>
                )}
                {items.length > 0 && actresses.length === 0 && (
                  <>（作品 {items.length}件）</>
                )}
                {items.length === 0 && actresses.length > 0 && (
                  <>（女優 {actresses.length}名）</>
                )}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <LoadingSpinner message="お気に入りを読み込み中..." />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : totalCount === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                お気に入りが見つかりませんでした。削除された可能性があります。
              </p>
            </div>
          ) : (
            <>
              {/* 作品セクション */}
              {items.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-100 mb-6">
                    作品 ({items.length}件)
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {items.map((item, index) => (
                      <ItemCard
                        key={item.content_id}
                        item={item}
                        priority={index < 8}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 女優セクション */}
              {actresses.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-100 mb-6">
                    女優 ({actresses.length}名)
                  </h2>
                  <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                      <div className="flex gap-4 w-max">
                        {actresses.map((actress) => (
                          <div key={actress.id} className="w-40 flex-shrink-0">
                            <ActressCard actress={actress} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default function FavoritesPageContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <LoadingSpinner message="読み込み中..." />
      </div>
    }>
      <FavoritesPageInner />
    </Suspense>
  );
}

