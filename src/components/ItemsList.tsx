'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { DMMItem } from '@/types/dmm';
import { useItemsData } from '@/hooks/useItemsData';
import ItemCard from './ItemCard';
import PromoSiteCards from './PromoSiteCards';
import Pagination from './Pagination';
import SortSelector from './SortSelector';
// ItemsPerPageSelector removed - always 100 items per page
import DetailedFilters from './DetailedFilters';
import { LoadingSkeleton } from './ui/Loading';
import { ErrorState } from './ui/EmptyState';
import { ItemFilters, DEFAULT_FILTERS } from '@/types/filters';
import { applyFilters } from '@/lib/filter-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ============================================
// 型定義
// ============================================

interface ItemsListProps {
  initialData: {
    items: DMMItem[];
    total_count: number;
  };
  initialPage: number;
  initialSort: string;
  basePath: string;
  title: string;
  description?: string;
  fetchParams?: {
    keyword?: string;
    article?: string;
    article_id?: string;
  };
}

// ============================================
// コンポーネント
// ============================================

/**
 * アイテム一覧表示コンポーネント（ハイブリッドSSR/CSR）
 */
export default function ItemsList({
  initialData,
  initialPage,
  initialSort,
  basePath,
  title,
  description,
  fetchParams = {},
}: ItemsListProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentPage = parseInt(searchParams.get('page') || initialPage.toString(), 10);
  const currentSort = searchParams.get('sort') || initialSort;
  const itemsPerPage = ITEMS_PER_PAGE;

  // 初回ロードかどうかを判定（初回のみinitialDataを使用）
  const isInitialLoad = currentPage === initialPage && currentSort === initialSort;

  const { items, total_count, isLoading, error, refetch } = useItemsData(
    {
      ...fetchParams,
      sort: currentSort,
      hits: itemsPerPage,
      page: currentPage,
      enabled: true, // 常に有効（フック内で制御）
    },
    isInitialLoad ? initialData : undefined
  );

  // フィルター状態管理
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS);
  
  // 単体作品のみ表示の状態管理
  const [showSoloOnly, setShowSoloOnly] = useState(false);

  // フィルター適用後のアイテム
  const filteredItems = useMemo(() => {
    let result = applyFilters(items, filters);
    // 単体作品のみ表示フィルターを適用
    if (showSoloOnly) {
      result = result.filter(item => (item.iteminfo?.actress?.length || 0) === 1);
    }
    return result;
  }, [items, filters, showSoloOnly]);

  // フィルター適用後の件数
  const filteredCount = filteredItems.length;

  // デバッグログ（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 ItemsList render:', {
        pathname,
        currentPage,
        currentSort,
        isInitialLoad,
        isLoading,
        itemsCount: items.length,
      });
    }
  }, [pathname, currentPage, currentSort, isInitialLoad, isLoading, items.length]);

  // エラー表示
  if (error) {
    return (
      <div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">{title}</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-400">
            {description || `${total_count}件の作品から厳選（ページ ${currentPage}）`}
          </p>
          <div className="flex items-center gap-4">
            <SortSelector currentSort={currentSort} basePath={basePath} />
          </div>
        </div>
      </div>

      {/* 単体作品のみ表示チェックボックス */}
      {!isLoading && items.length > 0 && (
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
        </div>
      )}

      {/* 詳細フィルター */}
      {!isLoading && items.length > 0 && (
        <DetailedFilters
          filters={filters}
          onChange={setFilters}
          onReset={() => {
            setFilters(DEFAULT_FILTERS);
            setShowSoloOnly(false);
          }}
        />
      )}

      {/* ローディング */}
      {isLoading ? (
        <LoadingSkeleton count={itemsPerPage} />
      ) : filteredItems.length > 0 ? (
        <>
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              {filteredItems.length}件表示{filteredCount !== total_count && ` / 全${total_count}件`}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {/* 同人サイト紹介カード（最初のページのみ、最初に表示） */}
            {currentPage === 1 && <PromoSiteCards />}
            {filteredItems.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4} // 最初の4枚のみ優先読み込み
                relatedItems={filteredItems.filter(i => i.content_id !== item.content_id)} // 他のアイテムを関連動画として渡す
                pageType={undefined}
                position={index}
              />
            ))}
          </div>
          {filteredCount === total_count && (
            <Pagination
              currentPage={currentPage}
              totalCount={total_count}
              itemsPerPage={itemsPerPage}
              basePath={basePath}
            />
          )}
        </>
      ) : items.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">フィルター条件に一致する作品がありませんでした。</p>
          <button
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            フィルターをリセット
          </button>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">作品が見つかりませんでした。</p>
        </div>
      )}
    </div>
  );
}
