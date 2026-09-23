'use client';

import { useState, useCallback, useMemo } from 'react';

interface SearchResult {
  text: string;
  type: 'actress' | 'genre';
  id: number;
  ruby?: string;
}

/**
 * オフライン検索用フック
 * APIエンドポイントを使用して検索機能を提供
 */
export function useOfflineSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cache, setCache] = useState<Map<string, SearchResult[]>>(new Map());

  /**
   * キーワードで女優とジャンルを検索
   * @param keyword 検索キーワード
   * @param maxResults 最大結果数（デフォルト: 10）
   * @returns 検索結果の配列
   */
  const search = useCallback(
    async (keyword: string, maxResults: number = 10): Promise<SearchResult[]> => {
      if (!keyword.trim()) {
        return [];
      }

      // キャッシュキー
      const cacheKey = `${keyword.toLowerCase().trim()}_${maxResults}`;

      // キャッシュをチェック
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey) || [];
      }

      try {
        setIsLoading(true);
        setError(null);

        // APIエンドポイントを呼び出す
        const response = await fetch(
          `/api/search/autocomplete?keyword=${encodeURIComponent(keyword)}&maxResults=${maxResults}`
        );

        if (!response.ok) {
          throw new Error('検索に失敗しました');
        }

        const data = await response.json();
        const results: SearchResult[] = data.results || [];

        // キャッシュに保存
        setCache((prev) => {
          const newCache = new Map(prev);
          newCache.set(cacheKey, results);
          // キャッシュサイズを制限（最大100件）
          if (newCache.size > 100) {
            const firstKey = newCache.keys().next().value;
            if (firstKey !== undefined) {
              newCache.delete(firstKey);
            }
          }
          return newCache;
        });

        setIsLoading(false);
        return results;
      } catch (err) {
        setIsLoading(false);
        setError(err instanceof Error ? err : new Error('不明なエラー'));
        return [];
      }
    },
    [cache]
  );

  // 同期的な検索関数（後方互換性のため）
  const searchSync = useMemo(
    () => (keyword: string, maxResults: number = 10): SearchResult[] => {
      if (!keyword.trim() || isLoading) {
        return [];
      }

      const cacheKey = `${keyword.toLowerCase().trim()}_${maxResults}`;
      return cache.get(cacheKey) || [];
    },
    [cache, isLoading]
  );

  return {
    search: searchSync, // 後方互換性のため、同期的な検索を返す
    searchAsync: search, // 非同期検索も利用可能
    isLoading,
    error,
  };
}

