/**
 * DMM データ取得（サーバーサイド）
 *
 * SSG/ISR ページからはここを直接呼び、自前 /api は経由しない。
 * クライアント向けは @/lib/dmm-client を使う。
 */

import { unstable_cache } from 'next/cache';
import { logError } from '@/lib/logger';
import {
  queryItemList,
  queryItemByCid,
  queryItemsByCids,
  queryActressSearch,
} from '@/lib/dmm-query';
import { convertActressInfo, hashString, deterministicShuffleItems } from '@/lib/dmm-utils';
import type {
  DMMItem,
  DMMResponse,
  ActressInfo,
  ActressResponse,
  FetchItemsParams,
  FetchActressParams,
} from '@/types/dmm';

export type {
  DMMItem,
  DMMResponse,
  ActressInfo,
  ActressResponse,
  FetchItemsParams,
  FetchActressParams,
};

export { convertActressInfo, hashString };

/**
 * 商品一覧を取得（サーバーサイドのみ）
 * unstable_cache で ISR と連携
 */
export async function fetchItems(params: FetchItemsParams = {}): Promise<{
  items: DMMItem[];
  total_count: number;
}> {
  const cacheKey = [
    'items',
    params.sort || 'rank',
    params.page?.toString() || '1',
    params.hits?.toString() || '60',
    params.keyword || '',
    params.article || '',
    params.article_id || '',
  ].join('-');

  const revalidateTime = params.keyword ? 600 : 604800;

  const cachedFetch = unstable_cache(
    async () => queryItemList(params, revalidateTime),
    [cacheKey],
    {
      revalidate: revalidateTime,
      tags: ['items'],
    }
  );

  try {
    const result = await cachedFetch();
    return {
      items: result.items,
      total_count: result.total_count,
    };
  } catch (error) {
    logError('Error in fetchItems:', error);
    return { items: [], total_count: 0 };
  }
}

/**
 * 商品詳細を取得（サーバーサイドのみ）
 */
export const fetchItemDetail = unstable_cache(
  async (cid: string): Promise<DMMItem | null> => {
    try {
      return await queryItemByCid(cid, 604800);
    } catch (error) {
      logError('Error in fetchItemDetail:', error);
      return null;
    }
  },
  ['item-detail'],
  {
    revalidate: 604800,
    tags: ['items'],
  }
);

/**
 * 女優情報を取得（サーバーサイドのみ）
 */
export async function fetchActressInfo(actressId: string): Promise<ActressInfo | null> {
  const cachedFetch = unstable_cache(
    async () => {
      const result = await queryActressSearch({ actress_id: actressId }, 604800);
      return result.actress[0] || null;
    },
    [`actress-info-${actressId}`],
    {
      revalidate: 604800,
      tags: ['actresses'],
    }
  );

  try {
    return await cachedFetch();
  } catch (error) {
    logError('Error in fetchActressInfo:', error);
    return null;
  }
}

/**
 * 複数の女優IDをまとめて取得（サーバーサイド）
 */
export async function fetchActressesByIds(actressIds: string[]): Promise<ActressInfo[]> {
  if (actressIds.length === 0) return [];

  try {
    const result = await queryActressSearch(
      { actress_id: actressIds.join(',') },
      600
    );
    return result.actress;
  } catch (error) {
    logError('Error in fetchActressesByIds:', error);
    return [];
  }
}

/**
 * 複数の作品IDをまとめて取得（サーバーサイド）
 */
export async function fetchItemsByIds(contentIds: string[]): Promise<DMMItem[]> {
  if (contentIds.length === 0) return [];

  try {
    return await queryItemsByCids(contentIds, 600);
  } catch (error) {
    logError('Error in fetchItemsByIds:', error);
    return [];
  }
}

/**
 * 女優をキーワードで検索（サーバーサイド）
 */
export async function searchActresses(keyword: string): Promise<{
  actresses: ActressInfo[];
  total_count: number;
}> {
  try {
    const result = await queryActressSearch({ keyword }, 600);
    return {
      actresses: result.actress,
      total_count: result.total_count,
    };
  } catch (error) {
    logError('Error in searchActresses:', error);
    return { actresses: [], total_count: 0 };
  }
}

/**
 * 作品をキーワードで検索（サーバーサイド）
 * クライアントからは @/lib/dmm-client の searchItems を使うこと
 */
export async function searchItems(params: FetchItemsParams = {}): Promise<{
  items: DMMItem[];
  total_count: number;
}> {
  try {
    const result = await queryItemList(params, params.keyword ? 600 : 172800);
    return {
      items: result.items,
      total_count: result.total_count,
    };
  } catch (error) {
    logError('Error in searchItems:', error);
    return { items: [], total_count: 0 };
  }
}

/**
 * おすすめ作品を取得（サーバーサイドのみ）
 */
export async function getRecommendedItems(
  excludeContentId?: string,
  count: number = 8
): Promise<DMMItem[]> {
  try {
    const { items } = await fetchItems({
      sort: 'rank',
      hits: 100,
      page: 1,
    });

    if (items.length === 0) return [];

    const filteredItems = excludeContentId
      ? items.filter((item) => item.content_id !== excludeContentId)
      : items;

    if (filteredItems.length === 0) return [];

    const seed = excludeContentId ?? 'recommended';
    const shuffled = deterministicShuffleItems(filteredItems, seed);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  } catch (error) {
    logError('Error in getRecommendedItems:', error);
    return [];
  }
}

/**
 * DMM APIのエラーハンドリング付きフェッチャー
 */
export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetcher();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}
