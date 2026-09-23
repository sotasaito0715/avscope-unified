'use client';

// GoogleAnalytics 4 (GA4) イベント送信ユーティリティ
declare global {
  interface Window {
    gtag: (
      command: 'event' | 'config' | 'set',
      action: string,
      parameters?: Record<string, unknown>
    ) => void;
  }
}

// ビデオイベントの型定義
export type VideoEventName =
  | 'video_page_view'
  | 'video_play'
  | 'video_play_manual'
  | 'video_swipe_next'
  | 'video_swipe_previous'
  | 'video_mute'
  | 'video_unmute'
  | 'video_impression'
  | 'video_complete';

export type VideoEventPayload = {
  item_id: string;          // content ID or equivalent
  item_title?: string;
  video_index?: number;     // index in the swipe list
  from_index?: number;
  to_index?: number;
  page_type?: 'list' | 'detail' | 'swipe';
  actress?: string;
  genre?: string;
  reason?: string;
  // allow extra arbitrary fields
  [key: string]: unknown;
};

// アフィリエイトクリックイベントの型定義
export type AffiliateClickPayload = {
  item_id: string;          // content ID
  item_title?: string;
  price?: number | string;
  actress?: string;
  genre?: string;
  currency?: string;
  value?: number;           // numeric value for GA4
  page_type?: 'list' | 'detail' | 'swipe' | 'item' | 'actress' | 'genre' | 'maker' | 'series' | 'article';
  position?: number;        // index in the list or swipe
  link_type?: 'main' | 'button' | 'banner';
  item_source?: 'fanza' | 'duga';
};

// 検索イベントの型定義
export type SearchEventPayload = {
  type: 'actress' | 'genre' | 'keyword';
  query: string;
  result_count?: number;
};

/**
 * Google Analyticsが有効かどうかを判定
 */
function isGAEnabled(): boolean {
  // 開発環境では無効化（devモードで確実に無効化）
  if (typeof window !== 'undefined') {
    const isDevelopment = 
      process.env.NODE_ENV === 'development' || 
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '0.0.0.0';
    
    // 環境変数で明示的に無効化されている場合も無効化
    const isEnabled = process.env.NEXT_PUBLIC_GA_ENABLED !== 'false' && !isDevelopment;
    
    return isEnabled;
  }
  
  // サーバーサイドでは常に無効化（クライアントサイドでのみ動作）
  return false;
}

// GA4イベント送信関数
export function sendGAEvent(
  eventName: string,
  parameters?: Record<string, unknown>
): void {
  // 開発環境では送信しない
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA Event] (開発環境では送信されません)', eventName, parameters);
    }
    return;
  }

  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, {
      event_category: 'conversion',
      event_label: parameters?.event_label || '',
      value: parameters?.value || 0,
      ...parameters,
    });
  }
}

/**
 * ページビューを送信
 * @param path - ページパス（例: '/item/123' または '/item/123?page=2'）
 * @param title - ページタイトル（省略時はdocument.titleを使用）
 */
export function trackPageView(path: string, title?: string): void {
  // 開発環境では送信しない
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA PageView] (開発環境では送信されません)', path, title || document.title);
    }
    return;
  }

  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  const pageLocation = typeof window !== 'undefined'
    ? window.location.origin + path
    : path;

  const pageTitle = title || (typeof document !== 'undefined' ? document.title : '');

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: pageLocation,
    page_title: pageTitle,
  });
}

/**
 * ビデオイベントを送信
 * @param eventName - ビデオイベント名
 * @param payload - イベントペイロード
 */
export function trackVideoEvent(
  eventName: VideoEventName,
  payload: VideoEventPayload
): void {
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA VideoEvent] (dev only)', eventName, payload);
    }
    return;
  }

  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', eventName, {
    event_category: 'video',
    ...payload,
  });
}

/**
 * アフィリエイトリンククリックイベント（新API）
 * @param payload - アフィリエイトクリックペイロード
 */
export function trackAffiliateClick(payload: AffiliateClickPayload): void;
/**
 * アフィリエイトリンククリックイベント（旧API - 後方互換性のため）
 * @deprecated 新しいAPI（payloadオブジェクト）を使用してください
 */
export function trackAffiliateClick(
  itemId: string,
  itemTitle: string,
  price?: string,
  actress?: string,
  genre?: string,
  pageType?: 'item' | 'actress' | 'genre' | 'maker' | 'series'
): void;
export function trackAffiliateClick(
  payloadOrItemId: AffiliateClickPayload | string,
  itemTitle?: string,
  price?: string,
  actress?: string,
  genre?: string,
  pageType?: 'item' | 'actress' | 'genre' | 'maker' | 'series'
): void {
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA AffiliateClick] (dev only)', payloadOrItemId);
    }
    return;
  }

  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // 旧APIとの互換性: 文字列が渡された場合は旧形式として処理
  let payload: AffiliateClickPayload;
  if (typeof payloadOrItemId === 'string') {
    // 旧API形式
    const numericPrice = price ? parseFloat(price.replace(/[^\d]/g, '')) : 0;
    payload = {
      item_id: payloadOrItemId,
      item_title: itemTitle || '',
      price: price || '0',
      actress: actress || '',
      genre: genre || '',
      currency: 'JPY',
      value: numericPrice,
      page_type: pageType || undefined,
    };
  } else {
    // 新API形式
    payload = payloadOrItemId;
    // priceが文字列の場合は数値に変換
    if (typeof payload.price === 'string') {
      payload.value = parseFloat(payload.price.replace(/[^\d]/g, '')) || 0;
    } else if (typeof payload.price === 'number') {
      payload.value = payload.value ?? payload.price;
    }
    if (!payload.currency) {
      payload.currency = 'JPY';
    }
  }

  // ページタイプに応じたイベント名を生成
  const eventName = payload.page_type
    ? `affiliate_click_${payload.page_type}`
    : 'affiliate_click';

  window.gtag('event', eventName, {
    event_category: 'conversion',
    key_event: true,
    ...payload,
  });
}

/**
 * 検索イベントを送信
 * @param payload - 検索イベントペイロード
 */
export function trackSearchEvent(payload: SearchEventPayload): void {
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[GA SearchEvent] (dev only)', payload);
    }
    return;
  }

  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'search', {
    event_category: 'search',
    search_type: payload.type,
    search_term: payload.query,
    result_count: payload.result_count,
  });
}
