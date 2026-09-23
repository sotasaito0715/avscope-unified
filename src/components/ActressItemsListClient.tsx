'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import ClientPagination from './ClientPagination';
import ClientSortSelector from './ClientSortSelector';
import { LoadingSkeleton } from './ui/Loading';
import { ErrorState } from './ui/EmptyState';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ============================================
// 型定義
// ============================================

interface ActressItemsListClientProps {
  actressId: string;
  initialData: {
    items: DMMItem[];
    total_count: number;
  };
  initialSort?: string;
}

// ============================================
// ユーティリティ関数
// ============================================

function updateUrl(actressId: string, page: number, sort: string) {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams();
  if (page > 1) {
    params.set('page', page.toString());
  }
  if (sort !== 'rank') {
    params.set('sort', sort);
  }
  
  const queryString = params.toString();
  const newUrl = queryString ? `/actress/${actressId}?${queryString}` : `/actress/${actressId}`;
  
  window.history.replaceState({}, '', newUrl);
}

// ============================================
// コンポーネント
// ============================================

export default function ActressItemsListClient({
  actressId,
  initialData,
  initialSort = 'rank',
}: ActressItemsListClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSort, setCurrentSort] = useState(initialSort);
  const [items, setItems] = useState(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.total_count);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showSoloOnly, setShowSoloOnly] = useState(false);

  const itemsPerPage = ITEMS_PER_PAGE;

  const filteredItems = useMemo(() => {
    if (!showSoloOnly) return items;
    return items.filter(item => (item.iteminfo?.actress?.length || 0) === 1);
  }, [items, showSoloOnly]);

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
        article: 'actress',
        article_id: actressId,
      });
      
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
  }, [actressId, itemsPerPage]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(actressId, newPage, currentSort);
    
    if (newPage !== 1 || currentSort !== initialSort) {
      fetchData(newPage, currentSort);
    } else {
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [actressId, currentSort, initialSort, initialData, fetchData]);

  const handleSortChange = useCallback((newSort: string) => {
    setCurrentSort(newSort);
    setCurrentPage(1);
    updateUrl(actressId, 1, newSort);
    
    if (newSort !== initialSort) {
      fetchData(1, newSort);
    } else {
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
  }, [actressId, initialSort, initialData, fetchData]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 ActressItemsListClient:', {
        actressId,
        currentPage,
        currentSort,
        isLoading,
        itemsCount: items.length,
      });
    }
  }, [actressId, currentPage, currentSort, isLoading, items.length]);

  if (error) {
    return (
      <ErrorState 
        message={error.message} 
        onRetry={() => fetchData(currentPage, currentSort)} 
      />
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-100 mb-3">
          出演作品
        </h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-400 text-sm">
            {totalCount}件の作品が見つかりました（ページ {currentPage}）
          </p>
          <ClientSortSelector 
            currentSort={currentSort} 
            onSortChange={handleSortChange} 
          />
        </div>
      </div>

      {/* 単体作品のみ表示 */}
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
          {showSoloOnly && (
            <span className="text-gray-400 text-sm">
              ({filteredItems.length}件 / 全{items.length}件)
            </span>
          )}
        </div>
      )}

      {/* ローディング */}
      {isLoading ? (
        <LoadingSkeleton count={itemsPerPage} />
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">作品が見つかりませんでした。</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <>
          <div className="text-center py-12">
            <p className="text-gray-400">単体作品のみ表示の条件に一致する作品がありませんでした。</p>
            <button
              type="button"
              onClick={() => setShowSoloOnly(false)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              単体作品のみ表示を解除
            </button>
          </div>
          {totalCount > itemsPerPage && (
            <ClientPagination
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filteredItems.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={filteredItems.filter(i => i.content_id !== item.content_id)}
                pageType="actress"
                position={index}
              />
            ))}
          </div>
          {totalCount > itemsPerPage && (
            <ClientPagination
              currentPage={currentPage}
              totalCount={totalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}

