/**
 * 女優検索フォーム用カスタムフック
 */

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { ActressFormState } from '@/types/actress';
import { buildUrl, hasValidSearchParams } from '@/lib/url-utils';

// ============================================
// 型定義
// ============================================

interface UseActressSearchParams {
  initialParams: Record<string, string | undefined>;
}

interface UseActressSearchReturn {
  filters: ActressFormState;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  handleInputChange: (field: string, value: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleReset: () => void;
  hasActiveFilters: boolean;
}

// ============================================
// ヘルパー関数
// ============================================

/**
 * 詳細フィルターが設定されているかチェック
 */
function hasAdvancedFilters(params: Record<string, string | undefined>): boolean {
  const advancedKeys = [
    'gte_bust', 'lte_bust',
    'gte_waist', 'lte_waist',
    'gte_hip', 'lte_hip',
    'gte_height', 'lte_height',
    'gte_birthday', 'lte_birthday'
  ];

  return advancedKeys.some(key => params[key]);
}

/**
 * 初期フィルター状態を生成
 */
function getInitialFilters(params: Record<string, string | undefined>): ActressFormState {
  return {
    keyword: params.keyword || '',
    page: params.page || '1',
    sort: params.sort || '-id',
    gte_bust: params.gte_bust || '',
    lte_bust: params.lte_bust || '',
    gte_waist: params.gte_waist || '',
    lte_waist: params.lte_waist || '',
    gte_hip: params.gte_hip || '',
    lte_hip: params.lte_hip || '',
    gte_height: params.gte_height || '',
    lte_height: params.lte_height || '',
    gte_birthday: params.gte_birthday || '',
    lte_birthday: params.lte_birthday || '',
  };
}

/**
 * デフォルトフィルター状態を取得
 */
function getDefaultFilters(): ActressFormState {
  return {
    keyword: '',
    page: '1',
    sort: '-id',
    gte_bust: '',
    lte_bust: '',
    gte_waist: '',
    lte_waist: '',
    gte_hip: '',
    lte_hip: '',
    gte_height: '',
    lte_height: '',
    gte_birthday: '',
    lte_birthday: '',
  };
}

// ============================================
// カスタムフック
// ============================================

/**
 * 女優検索フォーム用カスタムフック
 * 
 * @description
 * 女優検索フォームのビジネスロジックを提供するフック。
 * フィルター状態の管理、フォーム送信、リセット処理を担当。
 * 
 * @param params - 初期パラメータ
 * @returns フォーム制御用の状態と関数
 * 
 * @example
 * ```tsx
 * function ActressSearchForm({ initialParams }: Props) {
 *   const {
 *     filters,
 *     handleInputChange,
 *     handleSubmit,
 *     handleReset,
 *   } = useActressSearch({ initialParams });
 * 
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 */
export function useActressSearch({
  initialParams
}: UseActressSearchParams): UseActressSearchReturn {
  const router = useRouter();

  // フィルター状態
  const [filters, setFilters] = useState<ActressFormState>(() => 
    getInitialFilters(initialParams)
  );

  // 詳細フィルターの表示/非表示
  const [showAdvanced, setShowAdvanced] = useState(() => 
    hasAdvancedFilters(initialParams)
  );

  // アクティブなフィルターがあるかどうか
  const hasActiveFilters = useMemo(() => 
    hasValidSearchParams(filters, ['sort']),
    [filters]
  );

  /**
   * 入力値の変更ハンドラ
   */
  const handleInputChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    // ページを1にリセットしたフィルターでURLを構築
    const filtersWithPage = { ...filters, page: '1' };
    const url = buildUrl('/actresses', filtersWithPage);
    
    router.push(url);
  }, [filters, router]);

  /**
   * フィルターリセットハンドラ
   */
  const handleReset = useCallback(() => {
    setFilters(getDefaultFilters());
    setShowAdvanced(false);
    router.push('/actresses');
  }, [router]);

  return {
    filters,
    showAdvanced,
    setShowAdvanced,
    handleInputChange,
    handleSubmit,
    handleReset,
    hasActiveFilters,
  };
}

