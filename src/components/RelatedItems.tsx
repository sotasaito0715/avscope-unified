'use client';

import { useEffect, useState } from 'react';
import type { DMMItem } from '@/types/dmm';
import { searchItems } from '@/lib/dmm-client';
import ItemCard from './ItemCard';
import { LoadingSkeleton } from './ui/Loading';

// ============================================
// 型定義
// ============================================

interface RelatedItemsProps {
  type: 'actress' | 'genre' | 'maker' | 'series' | 'price';
  id?: string;
  name?: string;
  currentItemId?: string;
  priceRange?: { min: number; max: number };
}

// ============================================
// コンポーネント
// ============================================

/**
 * 関連作品表示コンポーネント
 */
export default function RelatedItems({
  type,
  id,
  name,
  currentItemId,
  priceRange,
}: RelatedItemsProps) {
  const [items, setItems] = useState<DMMItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedItems = async () => {
      try {
        setIsLoading(true);

        const params: {
          hits: number;
          sort: string;
          article?: string;
          article_id?: string;
        } = {
          hits: 8,
          sort: 'rank',
        };

        // タイプに応じたパラメータ設定
        switch (type) {
          case 'actress':
          case 'genre':
          case 'maker':
          case 'series':
            if (id) {
              params.article = type;
              params.article_id = id;
            }
            break;
          case 'price':
            // 価格帯での検索は実装が複雑なのでスキップ
            // ここでは人気作品を表示
            break;
        }

        const data = await searchItems(params);
        
        // 現在の商品を除外
        const filteredItems = currentItemId
          ? data.items.filter(item => item.content_id !== currentItemId)
          : data.items;

        setItems(filteredItems.slice(0, 8));
      } catch (error) {
        console.error('Failed to fetch related items:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedItems();
  }, [type, id, currentItemId, priceRange]);

  // タイトル生成
  const getTitle = () => {
    switch (type) {
      case 'actress':
        return `出演女優の他の作品`;
      case 'genre':
        return `${name}の他の作品`;
      case 'maker':
        return `${name}の他の作品`;
      case 'series':
        return `${name}の他の作品`;
      case 'price':
        return '同じ価格帯の作品';
      default:
        return '関連作品';
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">{getTitle()}</h2>
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">{getTitle()}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <ItemCard
            key={item.content_id}
            item={item}
            priority={false}
          />
        ))}
      </div>
    </div>
  );
}

