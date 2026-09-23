'use client';

import { useEffect, useState } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import { LoadingSpinner } from './ui/Loading';

// ============================================
// 型定義
// ============================================

interface RelatedItemsByActressProps {
  currentItemId: string;
  actressIds: string[];
  maxCount?: number;
}

// ============================================
// コンポーネント
// ============================================

/**
 * 出演女優の他の作品を表示するコンポーネント（CSR）
 * ページ読み込み1秒後にAPIコールを実行
 */
export default function RelatedItemsByActress({
  currentItemId,
  actressIds,
  maxCount = 8,
}: RelatedItemsByActressProps) {
  const [items, setItems] = useState<DMMItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    // 女優IDが空の場合は何もしない
    if (actressIds.length === 0) {
      setIsLoading(false);
      return;
    }

    // 1秒後にAPIコールを実行
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);

        // 全ての女優IDをカンマ区切りで一度にリクエスト
        const actressIdsString = actressIds.join(',');

        const response = await fetch(
          `/api/items?article=actress&article_id=${actressIdsString}&hits=${maxCount}&sort=rank`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch items: ${response.status}`);
        }

        const data = await response.json();
        const fetchedItems: DMMItem[] = data.items || [];

        // 現在の作品を除外して返す
        const filteredItems = fetchedItems
          .filter((item) => item.content_id !== currentItemId)
          .slice(0, maxCount);

        setItems(filteredItems);
        setHasFetched(true);
      } catch (error) {
        console.error('Failed to fetch related items by actress:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }, 1000); // 1秒後に実行

    // クリーンアップ
    return () => {
      clearTimeout(timer);
    };
  }, [currentItemId, actressIds, maxCount]);

  // 女優IDが空の場合は何も表示しない
  if (actressIds.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">出演女優の他の作品</h2>
      {isLoading && !hasFetched ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" message="関連作品を読み込み中..." />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item, index) => (
            <ItemCard key={item.content_id} item={item} priority={index < 8} pageType="item" />
          ))}
        </div>
      ) : hasFetched ? (
        <div className="text-center py-8">
          <p className="text-gray-400">関連作品が見つかりませんでした。</p>
        </div>
      ) : null}
    </div>
  );
}

