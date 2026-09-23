import { NextRequest } from 'next/server';
import { withApiErrorHandling } from '@/lib/api-helpers';
import { queryItemList } from '@/lib/dmm-query';

// CDN / Data Cache。TTL は既存の query 側 revalidate と揃え、ASP コールを増やさない
export const revalidate = 172800;

/**
 * DMM ItemList API プロキシエンドポイント（クライアント向け）
 */
async function handleItemsRequest(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'rank';
  const keyword = searchParams.get('keyword') || '';
  const hits = parseInt(searchParams.get('hits') || '60', 10);
  const offsetParam = searchParams.get('offset');
  const offset =
    offsetParam && offsetParam !== '0' ? parseInt(offsetParam, 10) : 1;
  const article = searchParams.get('article') || '';
  const article_id = searchParams.get('article_id') || '';

  const result = await queryItemList(
    {
      sort,
      keyword: keyword || undefined,
      hits,
      offset,
      article: article || undefined,
      article_id: article_id || undefined,
    },
    172800
  );

  return {
    items: result.items,
    total_count: result.total_count.toString(),
    first_position: result.first_position || '1',
    result_count: result.result_count || result.items.length.toString(),
    status: result.status || 200,
  };
}

export const GET = withApiErrorHandling(
  async (request) => handleItemsRequest(request),
  {
    cache: {
      sMaxAge: 172800,
      staleWhileRevalidate: 345600,
    },
  }
);
