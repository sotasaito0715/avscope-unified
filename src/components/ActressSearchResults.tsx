'use client';

import { useEffect, useState } from 'react';
import ActressCard from './ActressCard';
import Pagination from './Pagination';
import { LoadingSkeleton } from './ui/Loading';
import { NoSearchResults } from './ui/EmptyState';
import { ActressInfo } from '@/types/dmm';
import { ITEMS_PER_PAGE } from '@/lib/constants';

// ============================================
// 型定義
// ============================================

interface ActressSearchResultsProps {
  searchParams: Record<string, string | undefined>;
}

interface SearchResults {
  actresses: ActressInfo[];
  total_count: number;
  result_count: number;
}

// ============================================
// コンポーネント
// ============================================

/**
 * 女優検索結果表示コンポーネント
 */
export default function ActressSearchResults({ searchParams }: ActressSearchResultsProps) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPage = parseInt(searchParams.page || '1', 10);
  const itemsPerPage = ITEMS_PER_PAGE;

  useEffect(() => {
    const fetchResults = async () => {
      // 検索パラメータ（page, sort以外）があるかチェック
      const hasSearchParams = Object.entries(searchParams).some(([key, value]) => {
        return key !== 'page' && key !== 'sort' && value;
      });

      if (!hasSearchParams) {
        setResults(null);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // オフセット計算
        const offset = currentPage > 1 ? (currentPage - 1) * itemsPerPage + 1 : 1;

        // クエリパラメータ構築
        const params = new URLSearchParams();
        Object.entries(searchParams).forEach(([key, value]) => {
          if (value && key !== 'page') {
            params.set(key, value);
          }
        });
        params.set('hits', itemsPerPage.toString());
        params.set('offset', offset.toString());

        const response = await fetch(`/api/actress?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch actresses');
        }

        const data = await response.json();
        
        setResults({
          actresses: data.actress || [],
          total_count: parseInt(data.total_count || '0', 10),
          result_count: data.result_count || 0,
        });
      } catch (err) {
        console.error('Error fetching actresses:', err);
        setError('女優の検索に失敗しました。');
        setResults(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [searchParams, currentPage, itemsPerPage]);

  // 検索実行前
  if (!results && !isLoading && !error) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16 text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-xl font-bold text-gray-100 mb-2">
          条件を指定して検索してください
        </h2>
        <p className="text-gray-400">
          キーワードやサイズ、身長などの条件で女優を検索できます
        </p>
      </div>
    );
  }

  // ローディング
  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-100">検索中...</h2>
        </div>
        <LoadingSkeleton count={itemsPerPage} />
      </div>
    );
  }

  // エラー
  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-16 w-16 text-red-500 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-xl font-bold text-gray-100 mb-2">エラーが発生しました</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  // 結果なし
  if (!results || results.actresses.length === 0) {
    return <NoSearchResults message="条件に一致する女優が見つかりませんでした。" />;
  }

  return (
    <div>
      {/* 結果サマリー */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-100">
          検索結果: {results.total_count}名
        </h2>
        <p className="text-gray-400 mt-2">
          {currentPage > 1 && `${(currentPage - 1) * itemsPerPage + 1}〜`}
          {Math.min(currentPage * itemsPerPage, results.total_count)}件目を表示中
        </p>
      </div>

      {/* 女優一覧 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {results.actresses.map((actress) => (
          <ActressCard key={actress.id} actress={actress} />
        ))}
      </div>

      {/* ページネーション */}
      <Pagination
        currentPage={currentPage}
        totalCount={results.total_count}
        itemsPerPage={itemsPerPage}
        basePath="/actresses"
      />
    </div>
  );
}

