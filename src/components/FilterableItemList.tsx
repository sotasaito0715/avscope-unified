'use client';

import { useState, useMemo } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import PromoSiteCards from './PromoSiteCards';

interface FilterableItemListProps {
  items: DMMItem[];
  pageType?: 'actress' | 'genre';
}

/**
 * 単体作品フィルター機能付きアイテムリストコンポーネント
 */
export default function FilterableItemList({ items, pageType }: FilterableItemListProps) {
  // 単体作品のみ表示の状態管理
  const [showSoloOnly, setShowSoloOnly] = useState(false);

  // フィルター適用後のアイテム
  const filteredItems = useMemo(() => {
    if (showSoloOnly) {
      return items.filter(item => (item.iteminfo?.actress?.length || 0) === 1);
    }
    return items;
  }, [items, showSoloOnly]);

  return (
    <>
      {/* 単体作品のみ表示チェックボックス */}
      {items.length > 0 && (
        <div className="mb-4 flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSoloOnly}
              onChange={(e) => setShowSoloOnly(e.target.checked)}
              className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500 focus:ring-2"
            />
            <span className="text-gray-300 text-sm">単体作品のみ表示</span>
          </label>
          {showSoloOnly && (
            <span className="text-gray-400 text-sm">
              ({filteredItems.length}件 / 全{items.length}件)
            </span>
          )}
        </div>
      )}

      {/* アイテムグリッド */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {/* 同人サイト紹介カード（最初に表示） */}
          <PromoSiteCards />
          {filteredItems.map((item) => (
            <ItemCard
              key={item.content_id}
              item={item}
              relatedItems={filteredItems.filter(i => i.content_id !== item.content_id)}
              pageType={pageType}
            />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">単体作品が見つかりませんでした。</p>
          <button
            onClick={() => setShowSoloOnly(false)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            フィルターを解除
          </button>
        </div>
      ) : null}
    </>
  );
}
