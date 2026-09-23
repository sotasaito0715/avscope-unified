'use client';

import { useEffect, useState, useCallback } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import PromoSiteCards from './PromoSiteCards';
import ClientPagination from './ClientPagination';
import { LoadingSkeleton } from './ui/Loading';
import { ErrorState } from './ui/EmptyState';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ============================================
// 型定義
// ============================================

type RankingType = 'popular' | 'new' | 'price-low' | 'price-high' | 'rating';

interface RankingsClientProps {
  initialData: {
    items: DMMItem[];
    total_count: number;
  };
  initialType?: RankingType;
}

interface RankingInfo {
  title: string;
  description: string;
  sort: string;
}

// ============================================
// 定数
// ============================================

const RANKING_TABS: { type: RankingType; label: string }[] = [
  { type: 'popular', label: '🔥 人気' },
  { type: 'new', label: '📅 新着' },
  { type: 'price-low', label: '💸 安い順' },
  { type: 'price-high', label: '💰 高い順' },
  { type: 'rating', label: '⭐ 評価' },
];

function getRankingInfo(type: RankingType): RankingInfo {
  switch (type) {
    case 'new':
      return { title: '新着ランキング', description: '最新の作品を発売日順で表示', sort: 'date' };
    case 'price-low':
      return { title: '価格ランキング（安い順）', description: '価格が安い順に作品を表示', sort: '-price' };
    case 'price-high':
      return { title: '価格ランキング（高い順）', description: '価格が高い順に作品を表示', sort: 'price' };
    case 'rating':
      return { title: '評価ランキング', description: '評価が高い順に作品を表示', sort: 'review' };
    case 'popular':
    default:
      return { title: '人気ランキング', description: 'DMMで人気の作品をランキング形式で表示', sort: 'rank' };
  }
}

// ============================================
// ユーティリティ関数
// ============================================

function updateUrl(type: RankingType, page: number) {
  if (typeof window === 'undefined') return;
  
  const params = new URLSearchParams();
  if (type !== 'popular') {
    params.set('type', type);
  }
  if (page > 1) {
    params.set('page', page.toString());
  }
  
  const queryString = params.toString();
  const newUrl = queryString ? `/rankings?${queryString}` : '/rankings';
  
  window.history.replaceState({}, '', newUrl);
}

// ============================================
// コンポーネント
// ============================================

export default function RankingsClient({
  initialData,
  initialType = 'popular',
}: RankingsClientProps) {
  const [currentType, setCurrentType] = useState<RankingType>(initialType);
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState(initialData.items);
  const [totalCount, setTotalCount] = useState(initialData.total_count);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const itemsPerPage = ITEMS_PER_PAGE;
  const rankingInfo = getRankingInfo(currentType);

  const fetchData = useCallback(async (type: RankingType, page: number) => {
    setIsLoading(true);
    setError(null);
    
    const info = getRankingInfo(type);
    
    try {
      // DMM APIはoffsetが1から始まるため、pageが1以下の場合はoffset=1
      const offset = page > 1 ? ((page - 1) * itemsPerPage + 1) : 1;
      const params = new URLSearchParams({
        sort: info.sort,
        hits: itemsPerPage.toString(),
        offset: offset.toString(),
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
  }, [itemsPerPage]);

  const handleTypeChange = useCallback((newType: RankingType) => {
    if (newType === currentType) return;
    
    setCurrentType(newType);
    setCurrentPage(1);
    updateUrl(newType, 1);
    
    // 初期タイプ以外はAPIを呼び出し
    if (newType !== initialType) {
      fetchData(newType, 1);
    } else {
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
  }, [currentType, initialType, initialData, fetchData]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    updateUrl(currentType, newPage);
    
    if (newPage !== 1 || currentType !== initialType) {
      fetchData(currentType, newPage);
    } else {
      setItems(initialData.items);
      setTotalCount(initialData.total_count);
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentType, initialType, initialData, fetchData]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 RankingsClient:', {
        currentType,
        currentPage,
        isLoading,
        itemsCount: items.length,
      });
    }
  }, [currentType, currentPage, isLoading, items.length]);

  if (error) {
    return (
      <ErrorState 
        message={error.message} 
        onRetry={() => fetchData(currentType, currentPage)} 
      />
    );
  }

  return (
    <div>
      {/* タイトル */}
      <h1 className="text-3xl font-bold text-white mb-6">{rankingInfo.title}</h1>
      <p className="text-gray-400 mb-6">{rankingInfo.description}</p>
      
      {/* ランキングタブ */}
      <div className="flex flex-wrap gap-2 mb-6">
        {RANKING_TABS.map((tab) => (
          <button
            key={tab.type}
            onClick={() => handleTypeChange(tab.type)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              currentType === tab.type
                ? 'bg-red-600 text-white'
                : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#252525]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ランキング一覧 */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm">
          {totalCount}件の作品（ページ {currentPage}）
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={itemsPerPage} />
      ) : items.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {currentPage === 1 && <PromoSiteCards />}
            {items.map((item, index) => (
              <ItemCard
                key={item.content_id}
                item={item}
                priority={index < 4}
                relatedItems={items.filter(i => i.content_id !== item.content_id)}
                pageType={undefined}
                position={index}
              />
            ))}
          </div>
          <ClientPagination
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
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

