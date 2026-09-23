'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import PromoSiteCards from './PromoSiteCards';
import ClientPagination from './ClientPagination';
import ClientSortSelector from './ClientSortSelector';
import DetailedFilters from './DetailedFilters';
import { LoadingSkeleton } from './ui/Loading';
import { ErrorState } from './ui/EmptyState';
import { ItemFilters, DEFAULT_FILTERS } from '@/types/filters';
import { applyFilters } from '@/lib/filter-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ============================================
// 型定義
// ============================================

interface ItemsListClientProps {
  initialData: {
    items: DMMItem[];
    total_count: number;
  };
  initialSort?: string;
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
// ユーティリティ関数
// ============================================

/**
 * URLを更新（サーバーリクエストなし）
 */
function updateUrl(basePath: string, page: number, sort: string) {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams();
  if (page > 1) {
    params.set('page', page.toString());
  }
  if (sort !== 'rank') {
    params.set('sort', sort);
  }
  
  const queryString = params.toString();
  const newUrl = queryString ? `${basePath}?${queryString}` : basePath;
  
  // サーバーリクエストなしでURLを更新
  window.history.replaceState({}, '', newUrl);
}

// ============================================
// コンポーネント
// ============================================

/**
 * クライアントサイドアイテム一覧コンポーネント
 * 
 * 1ページ目はサーバーで取得（ISR有効）
 * 2ページ目以降はクライアントからAPIを呼び出し
 * URLはhistory.replaceStateで更新（サーバーリクエストなし）
 */
export default function ItemsListClient({
  initialData,
  initialSort = 'rank',
  basePath,
  title,
  description,
  fetchParams = {},
}: ItemsListClientProps) {
  // 状態管理
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [items, setItems] = useState(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.total_count);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // フィルター状態管理
  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS);
  const [showSoloOnly, setShowSoloOnly] = useState(false);

  const itemsPerPage = ITEMS_PER_PAGE;

  // データ取得関数
  const fetchData = useCallback(async (page: number, sort: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // DMM APIはoffsetが1から始まるため、pageが1以下の場合はoffset=1
      const offset = page > 1 ? ((page - 1) * itemsPerPage + 1) : 1;
      const params = new URLSearchParams({
        sort,
        hits: itemsPerPage.toString(),
        offset: offset.toString(),
      });
      
      // fetchParamsを追加
      if (fetchParams.keyword) {
        params.set('keyword', fetchParams.keyword);
      }
      if (fetchParams.article) {
        params.set('article', fetchParams.article);
      }
      if (fetchParams.article_id) {
        params.set('article_id', fetchParams.article_id);
      }
      
      const response = await fetch(`/api/items?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setItems(data.items || []);
      setTotalCount(data.total_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('データの取得に失敗しました'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchParams, itemsPerPage]);

  // ページ変更ハンドラー
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(basePath, newPage, currentSort);
    
    // 1ページ目以外はAPIを呼び出し
    if (newPage !== 1 || currentSort !== initialSort) {
      fetchData(newPage, currentSort);
    } else {
      // 1ページ目で初期ソートの場合は初期データを使用
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
    
    // ページトップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [basePath, currentSort, initialSort, initialData, fetchData]);

  // ソート変更ハンドラー
  const handleSortChange = useCallback((newSort: string) => {
    setCurrentSort(newSort);
    setCurrentPage(1); // ソート変更時はページをリセット
    updateUrl(basePath, 1, newSort);
    
    // ソートが変わったらAPIを呼び出し
    if (newSort !== initialSort) {
      fetchData(1, newSort);
    } else {
      // 初期ソートに戻った場合は初期データを使用
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
  }, [basePath, initialSort, initialData, fetchData]);

  // フィルター適用後のアイテム
  const filteredItems = useMemo(() => {
    let result = applyFilters(items, filters);
    if (showSoloOnly) {
      result = result.filter(item => (item.iteminfo?.actress?.length || 0) === 1);
    }
    return result;
  }, [items, filters, showSoloOnly]);

  const filteredCount = filteredItems.length;

  // デバッグログ（開発環境のみ）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 ItemsListClient:', {
        currentPage,
        currentSort,
        isLoading,
        itemsCount: items.length,
      });
    }
  }, [currentPage, currentSort, isLoading, items.length]);

  // エラー表示
  if (error) {
    return (
      <div>
        <ErrorState 
          message={error.message} 
          onRetry={() => fetchData(currentPage, currentSort)} 
        />
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
            {description || `${totalCount}件の作品から厳選（ページ ${currentPage}）`}
          </p>
          <div className="flex items-center gap-4">
            <ClientSortSelector 
              currentSort={currentSort} 
              onSortChange={handleSortChange} 
            />
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
              {filteredItems.length}件表示{filteredCount !== totalCount && ` / 全${totalCount}件`}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {/* 姉妹サイト誘導カード（最初のページのみ） */}
            {currentPage === 1 && <PromoSiteCards />}
            {filteredItems.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={filteredItems.filter(i => i.content_id !== item.content_id)}
                pageType={undefined}
                position={index}
              />
            ))}
          </div>
          {filteredCount === totalCount && (
            <ClientPagination
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
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

