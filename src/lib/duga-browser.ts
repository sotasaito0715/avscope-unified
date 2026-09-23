/**
 * クライアント向け DUGA データ取得（自前 /api/duga プロキシのみ）
 */

import type { DMMItem, FetchItemsParams } from '@/types/dmm';

function calculateOffset(page: number, hits: number): number {
  return page > 1 ? (page - 1) * hits + 1 : 1;
}

export async function searchDugaItems(params: FetchItemsParams = {}): Promise<{
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

    const response = await fetch(`/api/duga/items?${searchParams.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to search DUGA items: ${response.status}`);
    }

    const data = (await response.json()) as {
      items?: DMMItem[];
      total_count?: string | number;
    };

    return {
      items: data.items || [],
      total_count:
        typeof data.total_count === 'string'
          ? parseInt(data.total_count, 10)
          : data.total_count || 0,
    };
  } catch (error) {
    console.error('Error in searchDugaItems:', error);
    return { items: [], total_count: 0 };
  }
}
