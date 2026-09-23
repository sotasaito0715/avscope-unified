/**
 * パフォーマンス最適化ライブラリ
 * 
 * @description
 * Core Web Vitals、画像最適化、リソース最適化のためのユーティリティを提供します。
 */

// ============================================
// Core Web Vitals最適化
// ============================================

/**
 * LCP (Largest Contentful Paint) 最適化
 */
export const LCP_OPTIMIZATION = {
  // 重要なリソースのプリロード
  criticalResources: [
    '/fonts/geist-sans.woff2',
    '/fonts/geist-mono.woff2',
  ],
  
  // 画像の最適化設定
  imageOptimization: {
    formats: ['image/webp', 'image/avif'],
    quality: 80,
    priority: true,
  },
  
  // 重要なCSSのインライン化
  criticalCSS: true,
} as const;

/**
 * FID (First Input Delay) 最適化
 */
export const FID_OPTIMIZATION = {
  // 非同期スクリプトの最適化
  asyncScripts: true,
  
  // 不要なJavaScriptの遅延読み込み
  deferNonCritical: true,
  
  // イベントリスナーの最適化
  passiveListeners: true,
} as const;

/**
 * CLS (Cumulative Layout Shift) 最適化
 */
export const CLS_OPTIMIZATION = {
  // 画像のサイズ指定
  imageDimensions: true,
  
  // フォントの最適化
  fontDisplay: 'swap',
  
  // レイアウトシフトの防止
  layoutShiftPrevention: true,
} as const;

// ============================================
// 画像最適化
// ============================================

/**
 * 画像の最適化設定
 */
export const IMAGE_OPTIMIZATION = {
  // 対応フォーマット
  formats: ['image/webp', 'image/avif', 'image/jpeg', 'image/png'],
  
  // 品質設定
  quality: {
    high: 90,
    medium: 80,
    low: 70,
  },
  
  // サイズ設定
  sizes: {
    thumbnail: '150x150',
    small: '300x300',
    medium: '600x600',
    large: '1200x1200',
  },
  
  // レスポンシブ設定
  responsive: {
    breakpoints: [640, 768, 1024, 1280],
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  },
} as const;

/**
 * 画像の遅延読み込み設定
 */
export const LAZY_LOADING = {
  // 遅延読み込みの閾値
  threshold: 0.1,
  
  // プレースホルダー
  placeholder: 'blur',
  
  // プリロード設定
  preload: false,
} as const;

// ============================================
// リソース最適化
// ============================================

/**
 * リソースの優先度設定
 */
export const RESOURCE_PRIORITY = {
  // 高優先度リソース
  high: [
    '/fonts/geist-sans.woff2',
    '/fonts/geist-mono.woff2',
    '/css/globals.css',
  ],
  
  // 中優先度リソース
  medium: [
    '/js/main.js',
    '/js/components.js',
  ],
  
  // 低優先度リソース
  low: [
    '/js/analytics.js',
    '/js/third-party.js',
  ],
} as const;

/**
 * バンドル最適化
 */
export const BUNDLE_OPTIMIZATION = {
  // チャンク分割
  chunkSplitting: {
    vendor: true,
    common: true,
    async: true,
  },
  
  // ツリーシェイキング
  treeShaking: true,
  
  // ミニファイ
  minification: {
    js: true,
    css: true,
    html: true,
  },
} as const;

// ============================================
// キャッシュ最適化
// ============================================

/**
 * キャッシュ戦略
 */
export const CACHE_STRATEGY = {
  // 静的リソース
  static: {
    maxAge: 31536000, // 1年
    immutable: true,
  },
  
  // 動的リソース
  dynamic: {
    maxAge: 3600, // 1時間
    staleWhileRevalidate: 86400, // 1日
  },
  
  // APIレスポンス
  api: {
    maxAge: 300, // 5分
    staleWhileRevalidate: 3600, // 1時間
  },
} as const;

// ============================================
// パフォーマンス監視
// ============================================

/**
 * Core Web Vitalsの監視設定
 */
export const VITALS_MONITORING = {
  // 監視対象メトリクス
  metrics: ['LCP', 'FID', 'CLS', 'FCP', 'TTI'],
  
  // 閾値設定
  thresholds: {
    LCP: 2500, // 2.5秒
    FID: 100,  // 100ms
    CLS: 0.1,  // 0.1
    FCP: 1800, // 1.8秒
    TTI: 3800, // 3.8秒
  },
  
  // レポート設定
  reporting: {
    endpoint: '/api/vitals',
    sampleRate: 0.1, // 10%
  },
} as const;

// ============================================
// ユーティリティ関数
// ============================================

/**
 * リソースの優先度を判定
 */
export function getResourcePriority(url: string): 'high' | 'medium' | 'low' {
  if (RESOURCE_PRIORITY.high.some(resource => url.includes(resource))) {
    return 'high';
  }
  if (RESOURCE_PRIORITY.medium.some(resource => url.includes(resource))) {
    return 'medium';
  }
  return 'low';
}

/**
 * 画像の最適化設定を生成
 */
export function generateImageConfig(
  width: number,
  height: number,
  priority: boolean = false
) {
  return {
    width,
    height,
    priority,
    quality: IMAGE_OPTIMIZATION.quality.medium,
    formats: IMAGE_OPTIMIZATION.formats,
    sizes: IMAGE_OPTIMIZATION.responsive.sizes,
    placeholder: LAZY_LOADING.placeholder,
  };
}

/**
 * プリロード設定を生成
 */
export function generatePreloadConfig(resources: string[]) {
  return resources.map(resource => ({
    rel: 'preload',
    href: resource,
    as: resource.endsWith('.css') ? 'style' : 'script',
    ...(resource.endsWith('.woff2') && { type: 'font/woff2', crossorigin: 'anonymous' }),
  }));
}
