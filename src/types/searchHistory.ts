/**
 * 検索履歴機能の型定義ファイル
 *
 * @description
 * 検索履歴機能で使用される型定義を集約。
 * 検索クエリ、履歴管理、状態管理などの型を定義する。
 */

// ============================================
// 検索履歴の基本型
// ============================================

export type SearchType = 'keyword' | 'actress' | 'genre' | 'maker' | 'series';

export interface SearchEntry {
  id: string; // ユニークID (timestamp + query)
  query: string;
  type: SearchType;
  timestamp: number;
  resultCount?: number; // 検索結果数（オプション）
}

// ============================================
// 検索履歴状態管理の型
// ============================================

export interface SearchHistoryState {
  items: SearchEntry[];
  isHydrated: boolean; // クライアント側でハイドレーションが完了したか
}

export interface SearchHistoryActions {
  addSearch: (query: string, type?: SearchType, resultCount?: number) => void;
  removeSearch: (id: string) => void;
  clearHistory: () => void;
  getRecentSearches: (limit?: number) => SearchEntry[];
  getSearchesByType: (type: SearchType) => SearchEntry[];
}

// ============================================
// 検索履歴設定の型
// ============================================

export interface SearchHistoryConfig {
  maxItems: number;
  maxAge: number; // 最大保持期間（ミリ秒）
}

// ============================================
// デフォルト値
// ============================================

export const DEFAULT_SEARCH_HISTORY_CONFIG: SearchHistoryConfig = {
  maxItems: 50,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30日
};
