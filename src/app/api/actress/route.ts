import { NextRequest } from 'next/server';
import { createValidationError } from '@/lib/api-config';
import { withApiErrorHandling } from '@/lib/api-helpers';
import { queryActressSearch } from '@/lib/dmm-query';

// CDN / Data Cache。TTL は既存の query 側 revalidate と揃え、ASP コールを増やさない
export const revalidate = 172800;

/**
 * DMM ActressSearch API プロキシエンドポイント（クライアント向け）
 */
async function handleActressRequest(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const actress_id = searchParams.get('actress_id') || '';
  const keyword = searchParams.get('keyword') || '';
  const sort = searchParams.get('sort') || '';
  const hits = searchParams.get('hits') || '';
  const offset = searchParams.get('offset') || '';

  const gte_bust = searchParams.get('gte_bust') || '';
  const lte_bust = searchParams.get('lte_bust') || '';
  const gte_waist = searchParams.get('gte_waist') || '';
  const lte_waist = searchParams.get('lte_waist') || '';
  const gte_hip = searchParams.get('gte_hip') || '';
  const lte_hip = searchParams.get('lte_hip') || '';
  const gte_height = searchParams.get('gte_height') || '';
  const lte_height = searchParams.get('lte_height') || '';
  const gte_birthday = searchParams.get('gte_birthday') || '';
  const lte_birthday = searchParams.get('lte_birthday') || '';

  const hasParams =
    actress_id ||
    keyword ||
    gte_bust ||
    lte_bust ||
    gte_waist ||
    lte_waist ||
    gte_hip ||
    lte_hip ||
    gte_height ||
    lte_height ||
    gte_birthday ||
    lte_birthday;

  if (!hasParams) {
    throw createValidationError('At least one search parameter is required');
  }

  const result = await queryActressSearch(
    {
      actress_id: actress_id || undefined,
      keyword: keyword || undefined,
      sort: sort || undefined,
      hits: hits ? parseInt(hits, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      gte_bust: gte_bust || undefined,
      lte_bust: lte_bust || undefined,
      gte_waist: gte_waist || undefined,
      lte_waist: lte_waist || undefined,
      gte_hip: gte_hip || undefined,
      lte_hip: lte_hip || undefined,
      gte_height: gte_height || undefined,
      lte_height: lte_height || undefined,
      gte_birthday: gte_birthday || undefined,
      lte_birthday: lte_birthday || undefined,
    },
    172800
  );

  return {
    actress: result.actress,
    total_count: result.total_count.toString(),
    first_position: result.first_position || '1',
    result_count: result.result_count || result.actress.length.toString(),
  };
}

export const GET = withApiErrorHandling(
  async (request) => handleActressRequest(request),
  {
    cache: {
      sMaxAge: 172800,
      staleWhileRevalidate: 345600,
    },
  }
);
