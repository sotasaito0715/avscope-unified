'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { DataState } from '@/types';
import { ErrorHandler } from '@/lib/error-handler';

// ============================================
// 型定義
// ============================================

interface UseDataFetchOptions<T> {
  fetcher: (params: Record<string, unknown>) => Promise<T>;
  params: Record<string, unknown>;
  enabled?: boolean;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retries?: number;
  timeout?: number;
}

interface UseDataFetchResult<T> extends Omit<DataState<T>, 'data'> {
  data: T | undefined; // 完全CSR対応: undefinedを許可
  refetch: () => Promise<void>;
  isInitialLoading: boolean;
}

// ============================================
// カスタムフック
// ============================================

/**
 * 統合されたデータフェッチフック
 * 
 * @description
 * useItemsDataとuseActressDataの共通ロジックを統合したフック。
 * 汎用的なデータフェッチ機能を提供。
 * 
 * @param options - フェッチオプション
 * @returns データ状態と制御関数
 * 
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useDataFetch({
 *   fetcher: fetchItems,
 *   params: { keyword: 'test', page: 1 },
 *   enabled: true,
 *   initialData: { items: [], total_count: 0 }
 * });
 * ```
 */
export function useDataFetch<T>({
  fetcher,
  params,
  enabled = true,
  initialData,
  onSuccess,
  onError,
  retries = 3,
  timeout = 10000,
}: UseDataFetchOptions<T>): UseDataFetchResult<T> {
  // initialDataがundefinedの場合は、空のオブジェクトではなくundefinedを保持
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const prevParamsRef = useRef<string>('');
  const isInitialMount = useRef(true);
  const retryCountRef = useRef(0);

  const fetchData = useCallback(async (retryCount = 0): Promise<void> => {
    if (!enabled) {
      console.log('⏸️ Fetch disabled');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Fetching data:', params);
      
      // タイムアウト設定
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      const dataPromise = fetcher(params);
      const result = await Promise.race([dataPromise, timeoutPromise]);

      setData(result);
      setIsInitialLoading(false);
      retryCountRef.current = 0;

      onSuccess?.(result);
    } catch (err) {
      // 統一されたエラーハンドリングを使用
      const error = ErrorHandler.handleError(err);

      console.error('❌ Fetch error:', error);
      ErrorHandler.logError(error, 'useDataFetch');

      // リトライ処理
      if (retryCount < retries) {
        console.log(`🔄 Retrying... (${retryCount + 1}/${retries})`);
        retryCountRef.current = retryCount + 1;
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }

      setError(error);
      setIsInitialLoading(false);
      onError?.(error);
      ErrorHandler.notifyError(error, 'useDataFetch');
    } finally {
      setIsLoading(false);
    }
  }, [enabled, params, fetcher, onSuccess, onError, retries, timeout]);

  useEffect(() => {
    const currentParams = JSON.stringify(params);
    const hasParamsChanged = prevParamsRef.current !== currentParams;

    console.log('🔍 useDataFetch effect:', {
      isInitialMount: isInitialMount.current,
      hasInitialData: !!initialData,
      enabled,
      hasParamsChanged,
      currentParams: params,
    });

    // 初回マウント時
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevParamsRef.current = currentParams;
      
      // 初期データがない場合はフェッチ
      if (!initialData && enabled) {
        console.log('✨ Initial fetch (no initial data)');
        fetchData();
      } else {
        console.log('✅ Using initial data');
      }
      return;
    }

    // パラメータが変更された場合
    if (hasParamsChanged && enabled) {
      console.log('🔄 Params changed, fetching...');
      prevParamsRef.current = currentParams;
      fetchData();
    }
  }, [enabled, params, initialData, fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    isInitialLoading,
  };
}
