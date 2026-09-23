/**
 * クライアント向け DMM データ取得
 *
 * ブラウザからは自前 /api プロキシのみを呼ぶ。
 * 認証情報を含む DMM 直接呼び出しは行わない。
 */

import type { DMMItem, ActressInfo, FetchItemsParams } from '@/types/dmm';

function calculateOffset(page: number, hits: number): number {
  return page > 1 ? (page - 1) * hits + 1 : 1;
}

async function handleApiResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`${errorMessage}: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * 作品検索（クライアント → /api/items）
 */
export async function searchItems(params: FetchItemsParams = {}): Promise<{
  items: DMMItem[];
  total_count: number;
}> {
  try {
    const searchParams = new URLSearchParams();

    if (params.sort) searchParams.set('sort', params.sort);
    if (params.keyword) searchParams.set('keyword', params.keyword);
    if (params.hits) searchParams.set('hits', params.hits.toString());
    if (params.page && params.page > 1) {
      const offset = calculateOffset(params.page, params.hits || 60);
      searchParams.set('offset', offset.toString());
    }
    if (params.article) searchParams.set('article', params.article);
    if (params.article_id) searchParams.set('article_id', params.article_id);

    const response = await fetch(`/api/items?${searchParams.toString()}`);
    const data = await handleApiResponse<{
      items?: DMMItem[];
      total_count?: string | number;
    }>(response, 'Failed to search items');

    return {
      items: data.items || [],
      total_count:
        typeof data.total_count === 'string'
          ? parseInt(data.total_count, 10)
          : data.total_count || 0,
    };
  } catch (error) {
    console.error('Error in searchItems:', error);
    return { items: [], total_count: 0 };
  }
}

/**
 * 女優キーワード検索（クライアント → /api/actress）
 */
export async function searchActresses(keyword: string): Promise<{
  actresses: ActressInfo[];
  total_count: number;
}> {
  try {
    const searchParams = new URLSearchParams({ keyword });
    const response = await fetch(`/api/actress?${searchParams.toString()}`);
    const data = await handleApiResponse<{
      actress?: ActressInfo[];
      total_count?: string | number;
    }>(response, 'Failed to search actresses');

    return {
      actresses: data.actress || [],
      total_count:
        typeof data.total_count === 'string'
          ? parseInt(data.total_count, 10)
          : Number(data.total_count) || 0,
    };
  } catch (error) {
    console.error('Error in searchActresses:', error);
    return { actresses: [], total_count: 0 };
  }
}

/**
 * 複数女優ID取得（クライアント → /api/actress）
 */
export async function fetchActressesByIds(actressIds: string[]): Promise<ActressInfo[]> {
  if (actressIds.length === 0) return [];

  try {
    const searchParams = new URLSearchParams({
      actress_id: actressIds.join(','),
    });
    const response = await fetch(`/api/actress?${searchParams.toString()}`);
    if (!response.ok) {
      console.error(`Failed to fetch actresses: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data.actress) ? data.actress : [];
  } catch (error) {
    console.error('Error in fetchActressesByIds:', error);
    return [];
  }
}

/**
 * 複数作品ID取得（クライアント → /api/items/details）
 */
export async function fetchItemsByIds(contentIds: string[]): Promise<DMMItem[]> {
  if (contentIds.length === 0) return [];

  try {
    const response = await fetch(
      `/api/items/details?ids=${encodeURIComponent(contentIds.join(','))}`
    );
    if (!response.ok) {
      console.error(`Failed to fetch items: ${response.status}`);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch (error) {
    console.error('Error in fetchItemsByIds:', error);
    return [];
  }
}
