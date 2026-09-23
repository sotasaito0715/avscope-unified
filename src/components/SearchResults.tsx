'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DMMItem } from '@/types/dmm';
import { useItemsData } from '@/hooks/useItemsData';
import { useActressData } from '@/hooks/useActressData';
import ItemCard from './ItemCard';
import PromoSiteCards from './PromoSiteCards';
import ActressCard from './ActressCard';
import Pagination from './Pagination';
import SortSelector from './SortSelector';
import DetailedFilters from './DetailedFilters';
import CatalogTabs from './CatalogTabs';
import { LoadingSkeleton, LoadingSpinner } from './ui/Loading';
import { NoSearchResults, ErrorState } from './ui/EmptyState';
import { ItemFilters, DEFAULT_FILTERS } from '@/types/filters';
import { applyFilters } from '@/lib/filter-utils';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { trackSearchEvent } from '@/lib/analytics';
import { parseCatalogTab } from '@/lib/catalog';

function interleaveItems(fanzaItems: DMMItem[], dugaItems: DMMItem[]): DMMItem[] {
  const merged: DMMItem[] = [];
  const length = Math.max(fanzaItems.length, dugaItems.length);
  for (let index = 0; index < length; index += 1) {
    if (index < fanzaItems.length) merged.push(fanzaItems[index]);
    if (index < dugaItems.length) merged.push(dugaItems[index]);
  }
  return merged;
}

export default function SearchResults() {
  const searchParams = useSearchParams();

  const query = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const currentSort = searchParams.get('sort') || 'rank';
  const catalog = parseCatalogTab(searchParams.get('src'));
  const itemsPerPage = ITEMS_PER_PAGE;

  const fanzaEnabled = catalog !== 'duga';
  const dugaEnabled = catalog !== 'fanza';
  const shouldFetchActresses = currentPage === 1 && catalog !== 'duga';

  const {
    actresses,
    total_count: actressTotalCount,
    isLoading: actressLoading,
    error: actressError,
  } = useActressData({
    keyword: query,
    enabled: shouldFetchActresses,
  });

  const fanzaResult = useItemsData({
    keyword: query,
    sort: currentSort,
    hits: itemsPerPage,
    page: currentPage,
    source: 'fanza',
    enabled: fanzaEnabled,
  });

  const dugaResult = useItemsData({
    keyword: query,
    sort: currentSort,
    hits: itemsPerPage,
    page: currentPage,
    source: 'duga',
    enabled: dugaEnabled,
  });

  const items = useMemo(() => {
    if (catalog === 'duga') return dugaResult.items;
    if (catalog === 'fanza') return fanzaResult.items;
    return interleaveItems(fanzaResult.items, dugaResult.items);
  }, [catalog, fanzaResult.items, dugaResult.items]);

  const total_count =
    catalog === 'duga'
      ? dugaResult.total_count
      : catalog === 'fanza'
        ? fanzaResult.total_count
        : fanzaResult.total_count + dugaResult.total_count;

  const isLoading =
    (shouldFetchActresses && actressLoading) ||
    (fanzaEnabled && fanzaResult.isLoading) ||
    (dugaEnabled && dugaResult.isLoading);
  const error = actressError || fanzaResult.error || dugaResult.error;
  const refetch = () => {
    void fanzaResult.refetch();
    void dugaResult.refetch();
  };

  const [filters, setFilters] = useState<ItemFilters>(DEFAULT_FILTERS);
  const [showSoloOnly, setShowSoloOnly] = useState(false);

  useEffect(() => {
    if (query && query.trim() && !isLoading) {
      const searchType = actressTotalCount > 0 ? 'actress' : 'keyword';
      trackSearchEvent({
        type: searchType,
        query: query.trim(),
        result_count: searchType === 'actress' ? actressTotalCount : total_count,
      });
    }
  }, [query, actressTotalCount, total_count, isLoading]);

  const filteredItems = useMemo(() => {
    let result = applyFilters(items, filters);
    if (showSoloOnly) {
      result = result.filter((item) => (item.iteminfo?.actress?.length || 0) === 1);
    }
    return result;
  }, [items, filters, showSoloOnly]);

  const filteredCount = filteredItems.length;

  const relatedItemsMap = useMemo(() => {
    const map = new Map<string, DMMItem[]>();
    filteredItems.forEach((item) => {
      map.set(
        `${item.service_code}-${item.content_id}`,
        filteredItems.filter(
          (other) => !(other.content_id === item.content_id && other.service_code === item.service_code)
        )
      );
    });
    return map;
  }, [filteredItems]);

  if (error) {
    return (
      <div>
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  if (!isLoading && actresses.length === 0 && items.length === 0) {
    return (
      <div>
        <CatalogTabs
          current={catalog}
          fanzaCount={fanzaResult.total_count}
          dugaCount={dugaResult.total_count}
        />
        <NoSearchResults query={query} headingAs="h1" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-100 mb-4">「{query}」の検索結果</h1>
        <CatalogTabs
          current={catalog}
          fanzaCount={fanzaEnabled ? fanzaResult.total_count : undefined}
          dugaCount={dugaEnabled ? dugaResult.total_count : undefined}
        />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-gray-400">
            {actressTotalCount > 0 && `女優 ${actressTotalCount}名 / `}
            FANZA {fanzaEnabled ? fanzaResult.total_count : 0}件 / DUGA {dugaEnabled ? dugaResult.total_count : 0}件
            （ページ {currentPage}）
          </p>
          <div className="flex items-center gap-4">
            <SortSelector currentSort={currentSort} basePath="/search" />
          </div>
        </div>
      </div>

      {currentPage === 1 && actressLoading && (
        <div className="mb-8">
          <LoadingSpinner size="sm" message="女優を検索中..." />
        </div>
      )}

      {currentPage === 1 && actresses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">女優 ({actressTotalCount}名)</h2>
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

      {isLoading ? (
        <LoadingSkeleton count={itemsPerPage} />
      ) : filteredItems.length > 0 ? (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-100">
              作品 ({filteredItems.length}件{filteredCount !== total_count && ` / 全${total_count}件`})
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {currentPage === 1 && catalog !== 'duga' && <PromoSiteCards />}
            {filteredItems.map((item, index) => (
              <ItemCard
                key={`${item.service_code}-${item.content_id}`}
                item={item}
                priority={index < 4}
                relatedItems={relatedItemsMap.get(`${item.service_code}-${item.content_id}`) || []}
                position={index}
              />
            ))}
          </div>
          {total_count > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalCount={total_count}
              itemsPerPage={itemsPerPage}
              basePath="/search"
            />
          )}
        </>
      ) : items.length > 0 ? (
        <>
          <div className="text-center py-12">
            <p className="text-gray-400">フィルター条件に一致する作品がありませんでした。</p>
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              フィルターをリセット
            </button>
          </div>
          {total_count > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalCount={total_count}
              itemsPerPage={itemsPerPage}
              basePath="/search"
            />
          )}
        </>
      ) : actresses.length > 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">「{query}」に一致する作品が見つかりませんでした。</p>
          <p className="text-sm text-gray-500 mt-2">上記の女優のページから作品を探してみてください。</p>
        </div>
      ) : null}
    </div>
  );
}
