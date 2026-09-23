'use client';

import { useMemo } from 'react';
import { searchActresses } from '@/lib/dmm-client';
import { ActressInfo } from '@/types/dmm';
import { useDataFetch } from './useDataFetch';

// ============================================
// 型定義
// ============================================

interface UseActressDataResult {
  actresses: ActressInfo[];
  total_count: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseActressDataOptions {
  keyword: string;
  enabled?: boolean;
  onSuccess?: (data: { actresses: ActressInfo[]; total_count: number }) => void;
  onError?: (error: Error) => void;
}

// ============================================
// カスタムフック
// ============================================

/**
 * 女優データをフェッチするカスタムフック
 * useDataFetchを使用して共通のデータフェッチロジックを活用
 */
export function useActressData(
  options: UseActressDataOptions,
  initialData?: { actresses: ActressInfo[]; total_count: number }
): UseActressDataResult {
  const { keyword, enabled = true, onSuccess, onError } = options;

  // キーワードが空の場合はフェッチしない
  const effectiveEnabled = enabled && !!keyword;

  // パラメータをオブジェクトとして統一
  const fetchParams = useMemo(
    () => ({ keyword }),
    [keyword]
  );

  // searchActressesをラップして、useDataFetchの要件に合わせる
  const fetchActresses = useMemo(
    () => async (params: Record<string, unknown>) => {
      const keyword = params.keyword as string;
      if (!keyword) {
        return { actresses: [], total_count: 0 };
      }
      const data = await searchActresses(keyword);
      return {
        actresses: data.actresses as unknown as ActressInfo[],
        total_count: data.total_count,
      };
    },
    []
  );

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useDataFetch({
    fetcher: fetchActresses,
    params: fetchParams,
    enabled: effectiveEnabled,
    initialData: initialData, // undefinedの場合は空オブジェクトを渡さない（完全CSR）
    onSuccess: onSuccess
      ? (data) => {
          onSuccess({
            actresses: data.actresses as ActressInfo[],
            total_count: data.total_count,
          });
        }
      : undefined,
    onError,
  });

  return {
    actresses: data?.actresses ?? [],
    total_count: data?.total_count ?? 0,
    isLoading,
    error,
    refetch,
  };
}
