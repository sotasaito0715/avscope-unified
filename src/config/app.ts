/**
 * アプリケーション設定
 * 
 * @description
 * アプリケーション全体で使用される設定値を集約。
 * 環境変数とデフォルト値を適切に管理。
 */

import { AppConfig, ApiConfig } from '@/types';

// ============================================
// 環境変数
// ============================================

const {
  DMM_API_ID,
  DMM_AFFILIATE_ID,
  DMM_SITE = 'FANZA',
  DMM_SERVICE = 'digital',
  DMM_FLOOR = 'videoa',
  NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-5KT9CTEE74',
  NODE_ENV = 'development',
} = process.env;

// ============================================
// アプリケーション設定
// ============================================

export const APP_CONFIG: AppConfig = {
  // ページネーション設定
  itemsPerPage: 40,
  maxActresses: 100,
  
  // キャッシュ設定
  cacheTime: 24 * 60 * 60 * 1000, // 24時間
  
  // リトライ設定
  retryAttempts: 3,
  
  // タイムアウト設定
  timeout: 10000, // 10秒
  
} as const;

// ============================================
// API設定
// ============================================

export const API_CONFIG: ApiConfig = {
  baseUrl: 'https://affiliate.dmm.com/api/v3',
  timeout: 10000,
  retries: 3,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'AV-Scope/1.0',
  },
} as const;

// ============================================
// DMM API設定
// ============================================

export const DMM_CONFIG = {
  apiId: DMM_API_ID,
  affiliateId: DMM_AFFILIATE_ID,
  site: DMM_SITE,
  service: DMM_SERVICE,
  floor: DMM_FLOOR,
} as const;

// ============================================
// Google Analytics設定
// ============================================

export const GA_CONFIG = {
  measurementId: NEXT_PUBLIC_GA_MEASUREMENT_ID,
  enabled: !!NEXT_PUBLIC_GA_MEASUREMENT_ID,
} as const;

// ============================================
// 画像最適化設定
// ============================================

export const IMAGE_CONFIG = {
  // 画像品質設定
  thumbnailQuality: 75,
  fullQuality: 90,
  
  // 画像サイズ設定
  thumbnailSizes: '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
  fullSizes: '(max-width: 1024px) 100vw, 50vw',
  
  // プレースホルダー設定
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
} as const;

// ============================================
// SEO設定
// ============================================

export const SEO_CONFIG = {
  siteName: 'AV Scope Mix',
  siteDescription: 'FANZA と DUGA を横断検索する試験サイト。',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://avscope-unified.vercel.app',
  twitterHandle: '@av_scope',
  defaultImage: '/og-image.jpg',
} as const;

// ============================================
// パフォーマンス設定
// ============================================

export const PERFORMANCE_CONFIG = {
  // 画像の優先読み込み
  priorityImageCount: 4,
  
  // 遅延読み込み
  lazyLoadOffset: 100,
  
  // デバウンス設定
  searchDebounceMs: 300,
  
  // キャッシュ戦略
  cacheStrategy: 'lru' as const,
  maxCacheSize: 100,
} as const;

// ============================================
// 開発設定
// ============================================

export const DEV_CONFIG = {
  enableDebugLogs: NODE_ENV === 'development',
  enablePerformanceMetrics: NODE_ENV === 'development',
  enableErrorReporting: NODE_ENV === 'production',
} as const;

// ============================================
// 機能フラグ設定
// ============================================

const {
  NEXT_PUBLIC_ENABLE_RELATED_ITEMS = 'false',
  NEXT_PUBLIC_ENABLE_SEARCH_SUGGESTIONS = 'false',
} = process.env;

export const FEATURE_FLAGS = {
  // Itemページでの関連作品表示
  enableRelatedItems: NEXT_PUBLIC_ENABLE_RELATED_ITEMS === 'true',
  
  // 検索時のサジェッション
  enableSearchSuggestions: NEXT_PUBLIC_ENABLE_SEARCH_SUGGESTIONS === 'true',
} as const;

// ============================================
// バリデーション設定
// ============================================

export const VALIDATION_CONFIG = {
  // 検索クエリの最大長
  maxSearchQueryLength: 100,
  
  // ページ番号の最大値
  maxPageNumber: 1000,
  
  // ソートオプション
  allowedSortOptions: ['rank', '-id', 'date', '-date', 'price', '-price'],
  
  // フィルター範囲
  filterRanges: {
    bust: { min: 60, max: 120, step: 1 },
    waist: { min: 50, max: 100, step: 1 },
    hip: { min: 70, max: 120, step: 1 },
    height: { min: 140, max: 180, step: 1 },
  },
} as const;

// ============================================
// エクスポート
// ============================================

const CONFIG = {
  APP_CONFIG,
  API_CONFIG,
  DMM_CONFIG,
  GA_CONFIG,
  IMAGE_CONFIG,
  SEO_CONFIG,
  PERFORMANCE_CONFIG,
  DEV_CONFIG,
  VALIDATION_CONFIG,
  FEATURE_FLAGS,
};

export default CONFIG;

