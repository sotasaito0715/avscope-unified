/**
 * 詳細フィルター機能の型定義ファイル
 */

export interface ItemFilters {
  minPrice?: number;
  maxPrice?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  minRating?: number; // 0-5
  minDuration?: number; // 分
  minActressCount?: number;
  maxActressCount?: number;
}

export const DEFAULT_FILTERS: ItemFilters = {};

