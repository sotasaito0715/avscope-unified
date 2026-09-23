'use client';

import type { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import Pagination from './Pagination';
import SortSelector from './SortSelector';
import { LoadingSkeleton } from './ui/Loading';
import { ErrorState } from './ui/EmptyState';

// ============================================
// 型定義
// ============================================

interface BaseItemListProps {
  items: DMMItem[];
  totalCount: number;
  currentPage: number;
  currentSort: string;
  basePath: string;
  title: string;
  description?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  showRelatedItems?: boolean;
  itemsPerPage?: number;
}

// ============================================
// コンポーネント
// ============================================

/**
 * 共通のアイテムリスト表示コンポーネント
 * 
 * @description
 * ItemsListとSearchResultsの共通ロジックを抽出したコンポーネント。
 * アイテムの表示、ページネーション、ソート機能を提供。
 */
export default function BaseItemList({
  items,
  totalCount,
  currentPage,
  currentSort,
  basePath,
  title,
  description,
  isLoading = false,
  error = null,
  onRetry,
  showRelatedItems = false,
  itemsPerPage = 60, // デフォルト60件
}: BaseItemListProps) {
  // エラー表示
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorState message={error.message} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">{title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-400">
            {description || `${totalCount}件の作品から厳選（ページ ${currentPage}）`}
          </p>
          <SortSelector currentSort={currentSort} basePath={basePath} />
        </div>
      </div>

      {/* ローディング */}
      {isLoading ? (
        <LoadingSkeleton count={itemsPerPage} />
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {items.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4} // 最初の4枚のみ優先読み込み
                relatedItems={showRelatedItems ? items.filter(i => i.content_id !== item.content_id) : []}
                position={index}
              />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            basePath={basePath}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">作品が見つかりませんでした。</p>
        </div>
      )}
    </div>
  );
}
