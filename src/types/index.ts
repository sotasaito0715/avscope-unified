/**
 * 統合型定義ファイル
 * 
 * @description
 * アプリケーション全体で使用される型定義を集約。
 * 型の再利用性と保守性を向上させる。
 */

// ============================================
// 基本型定義
// ============================================

export interface BaseItem {
  content_id: string;
  title: string;
  date: string;
  prices?: {
    price: string;
  };
  review?: {
    count: number;
    average: string;
  };
  imageURL?: {
    large?: string;
    list?: string;
    small?: string;
  };
}

export interface SearchParams {
  page?: string;
  sort?: string;
  keyword?: string;
  hits?: number;
}

export interface PaginationParams {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  basePath: string;
}

// ============================================
// API関連型定義
// ============================================

export interface ApiResponse<T> {
  data: T;
  total_count: number;
  success: boolean;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface FetchOptions {
  enabled?: boolean;
  retries?: number;
  timeout?: number;
}

// ============================================
// コンポーネント関連型定義
// ============================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error: Error | null;
}

export interface DataState<T> extends LoadingState {
  data: T;
  refetch: () => void;
}

// ============================================
// フォーム関連型定義
// ============================================

export interface FormState {
  [key: string]: string | number | boolean | undefined;
}

export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

// ============================================
// ユーティリティ型定義
// ============================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ============================================
// 設定関連型定義
// ============================================

export interface AppConfig {
  itemsPerPage: number;
  maxActresses: number;
  cacheTime: number;
  retryAttempts: number;
  timeout: number;
}

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  headers: Record<string, string>;
}

// ============================================
// イベント関連型定義
// ============================================

export interface CustomEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface EventHandler<T = unknown> {
  (event: CustomEvent<T>): void;
}

// ============================================
// パフォーマンス関連型定義
// ============================================

export interface PerformanceMetrics {
  renderTime: number;
  dataFetchTime: number;
  totalTime: number;
}

export interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

// ============================================
// エクスポート
// ============================================

export * from './actress';
export * from './dmm';
export * from './favorites';
export * from './searchHistory';
export * from './filters';
export * from './article';
