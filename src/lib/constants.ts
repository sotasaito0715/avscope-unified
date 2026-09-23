/**
 * アプリケーション全体で使用する定数定義
 */

// ============================================
// 女優検索フィルター範囲
// ============================================

export const ACTRESS_FILTER_RANGES = {
  bust: {
    min: 70,
    max: 110,
    defaultMin: 70,
    defaultMax: 110,
    unit: 'cm',
    label: 'バスト',
  },
  waist: {
    min: 50,
    max: 80,
    defaultMin: 50,
    defaultMax: 80,
    unit: 'cm',
    label: 'ウエスト',
  },
  hip: {
    min: 75,
    max: 105,
    defaultMin: 75,
    defaultMax: 105,
    unit: 'cm',
    label: 'ヒップ',
  },
  height: {
    min: 140,
    max: 180,
    defaultMin: 140,
    defaultMax: 180,
    unit: 'cm',
    label: '身長',
  },
} as const;

// ============================================
// ソートオプション
// ============================================

export const SORT_OPTIONS = {
  // 女優検索用
  actress: [
    { value: '-id', label: '新しい順' },
    { value: 'id', label: '古い順' },
    { value: 'name', label: '名前（あいうえお順）' },
    { value: '-name', label: '名前（逆順）' },
    { value: '-bust', label: 'バスト（大きい順）' },
    { value: 'bust', label: 'バスト（小さい順）' },
    { value: '-waist', label: 'ウエスト（大きい順）' },
    { value: 'waist', label: 'ウエスト（小さい順）' },
    { value: '-hip', label: 'ヒップ（大きい順）' },
    { value: 'hip', label: 'ヒップ（小さい順）' },
    { value: '-height', label: '身長（高い順）' },
    { value: 'height', label: '身長（低い順）' },
    { value: '-birthday', label: '生年月日（若い順）' },
    { value: 'birthday', label: '生年月日（年配順）' },
  ],
  
  // アイテム検索用
  items: [
    { value: 'rank', label: '人気' },
    { value: 'price', label: '価格が高い順' },
    { value: '-price', label: '価格が安い順' },
    { value: 'date', label: '発売日' },
    { value: 'review', label: '評価' },
    { value: 'match', label: 'マッチング順' },
  ],
} as const;

// ============================================
// ページネーション設定
// ============================================

export const ITEMS_PER_PAGE = 60; // 検索結果の1ページあたりの表示数

export const PAGINATION_DEFAULTS = {
  itemsPerPage: 40,
  actressPerPage: 40,
  maxActressSearch: 100,
} as const;

// ============================================
// API設定
// ============================================

export const API_DEFAULTS = {
  items: {
    sort: 'rank',
    hits: 40,
  },
  actress: {
    sort: '-id',
    hits: 100,
  },
} as const;

// ============================================
// キャッシュ設定（秒）
// ============================================

export const CACHE_DURATION = {
  items: 60 * 5, // 5分
  actress: 60 * 60, // 1時間
  actressInfo: 60 * 60 * 24, // 24時間
  itemDetail: 60 * 60 * 24, // 24時間
  default: 60 * 60 * 24, // 24時間（デフォルト）
  search: 60 * 60, // 1時間（検索結果）
  sitemap: 60 * 60, // 1時間（サイトマップ）
} as const;

// ============================================
// API設定
// ============================================

export const API_CONFIG = {
  retries: 3, // デフォルトリトライ回数
  timeout: 10000, // デフォルトタイムアウト（ミリ秒）
  retryDelay: 1000, // リトライ間隔（ミリ秒）
} as const;

// ============================================
// ストレージキー
// ============================================

export const STORAGE_KEYS = {
  favorites: 'avscope_favorites',
  searchHistory: 'avscope_search_history',
} as const;

// ============================================
// グリッドレイアウト
// ============================================

export const GRID_LAYOUTS = {
  items: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  actresses: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  relatedItems: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
} as const;

// ============================================
// 画像設定
// ============================================

export const IMAGE_CONFIG = {
  quality: {
    thumbnail: 80,
    full: 90,
  },
  priorityCount: 4, // 最初の4枚のみ優先読み込み
  sizes: {
    item: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw',
    actress: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 16vw, 160px',
    detail: '(max-width: 1024px) 100vw, 50vw',
  },
} as const;

// ============================================
// カラー設定
// ============================================

export const COLORS = {
  primary: 'red-600',
  primaryHover: 'red-700',
  primaryFocus: 'red-500',
  background: {
    primary: '#0a0a0a',
    secondary: '#1a1a1a',
    tertiary: '#252525',
  },
  border: '#333333',
  text: {
    primary: 'gray-100',
    secondary: 'gray-300',
    tertiary: 'gray-400',
    muted: 'gray-500',
  },
} as const;

// ============================================
// ルート設定
// ============================================

export const ROUTES = {
  home: '/',
  search: '/search',
  actresses: '/actresses',
  actress: (id: string | number) => `/actress/${id}`,
  item: (cid: string) => `/item/${cid}`,
  genre: (id: string | number) => `/genre/${id}`,
  maker: (id: string | number) => `/maker/${id}`,
  series: (id: string | number) => `/series/${id}`,
} as const;

// ============================================
// エラーメッセージ
// ============================================

export const ERROR_MESSAGES = {
  api: {
    credentials: 'API credentials not configured',
    fetch: 'Failed to fetch data from API',
    validation: 'At least one search parameter is required',
  },
  network: {
    offline: 'ネットワークに接続できません',
    timeout: 'リクエストがタイムアウトしました',
  },
  notFound: {
    item: '作品が見つかりませんでした',
    actress: '女優が見つかりませんでした',
    generic: 'お探しのページが見つかりませんでした',
  },
} as const;

