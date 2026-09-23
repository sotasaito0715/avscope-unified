'use client';

import { useMemo } from 'react';
import { searchItems } from '@/lib/dmm-client';
import { searchDugaItems } from '@/lib/duga-browser';
import type { FetchItemsParams } from '@/types/dmm';
import { DMMItem } from '@/types/dmm';
import { useDataFetch } from './useDataFetch';
import type { CatalogSource } from '@/lib/catalog';

// ============================================
// 型定義
// ============================================

interface UseItemsDataResult {
  items: DMMItem[];
  total_count: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseItemsDataOptions extends FetchItemsParams {
  enabled?: boolean; // フェッチを有効にするか
  source?: CatalogSource;
  onSuccess?: (data: { items: DMMItem[]; total_count: number }) => void;
  onError?: (error: Error) => void;
}

// ============================================
// カスタムフック
// ============================================

/**
 * アイテムデータをフェッチするカスタムフック
 * useDataFetchを使用して共通のデータフェッチロジックを活用
 */
export function useItemsData(
  params: UseItemsDataOptions = {},
  initialData?: { items: DMMItem[]; total_count: number }
): UseItemsDataResult {
  const { enabled = true, source = 'fanza', onSuccess, onError, ...fetchParams } = params;
  const { sort, keyword, hits, page, article, article_id } = fetchParams;

  // パラメータをオブジェクトとして統一（useDataFetchの要件に合わせる）
  const fetchParamsObj = useMemo(
    () => ({ sort, keyword, hits, page, article, article_id, source }),
    [sort, keyword, hits, page, article, article_id, source]
  );

  // searchItemsをラップして、useDataFetchの要件に合わせる
  const fetchItems = useMemo(
    () => async (params: Record<string, unknown>) => {
      const fetchParams: FetchItemsParams = {
        sort: params.sort as string,
        keyword: params.keyword as string,
        hits: params.hits as number,
        page: params.page as number,
        article: params.article as string,
        article_id: params.article_id as string,
      };
      if (params.source === 'duga') {
        return await searchDugaItems(fetchParams);
      }
      return await searchItems(fetchParams);
    },
    []
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useDataFetch({
    fetcher: fetchItems,
    params: fetchParamsObj as Record<string, unknown>,
    enabled,
    initialData: initialData, // undefinedの場合は空オブジェクトを渡さない（完全CSR）
    onSuccess,
    onError,
  });

  return {
    items: data?.items ?? [],
    total_count: data?.total_count ?? 0,
    isLoading,
    error,
    refetch,
  };
}
