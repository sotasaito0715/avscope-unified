import { NextRequest } from 'next/server';
import { createValidationError } from '@/lib/api-config';
import { withApiErrorHandling } from '@/lib/api-helpers';
import { queryItemsByCids } from '@/lib/dmm-query';

export const revalidate = 172800;

/**
 * 複数の作品IDをまとめて取得するエンドポイント（クライアント向け）
 */
async function handleItemsDetailsRequest(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get('ids') || '';

  if (!idsParam) {
    throw createValidationError('ids parameter is required');
  }

  const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    throw createValidationError('No valid ids provided');
  }

  const items = await queryItemsByCids(ids, 86400);

  return {
    items,
    total_count: items.length,
  };
}

export const GET = withApiErrorHandling(
  async (request) => handleItemsDetailsRequest(request),
  {
    cache: {
      sMaxAge: 86400,
      staleWhileRevalidate: 172800,
    },
  }
);
