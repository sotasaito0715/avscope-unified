import { NextRequest } from 'next/server';
import { withApiErrorHandling } from '@/lib/api-helpers';
import { fetchItemsFromDuga } from '@/lib/duga-client';

export const revalidate = 172800;

async function handleDugaItemsRequest(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sort = searchParams.get('sort') || 'rank';
  const keyword = searchParams.get('keyword') || '';
  const hits = parseInt(searchParams.get('hits') || '60', 10);
  const offsetParam = searchParams.get('offset');
  const offset =
    offsetParam && offsetParam !== '0' ? parseInt(offsetParam, 10) : 1;
  const article = searchParams.get('article') || '';
  const article_id = searchParams.get('article_id') || '';

  const result = await fetchItemsFromDuga(
    {
      sort,
      keyword: keyword || undefined,
      hits,
      offset,
      page: undefined,
      article: article || undefined,
      article_id: article_id || undefined,
    },
    172800
  );

  return {
    items: result.items,
    total_count: result.total_count.toString(),
    first_position: String(offset),
    result_count: result.items.length.toString(),
    status: 200,
  };
}

export const GET = withApiErrorHandling(
  async (request) => handleDugaItemsRequest(request),
  {
    requireAuth: false,
    cache: {
      sMaxAge: 172800,
      staleWhileRevalidate: 345600,
    },
  }
);
