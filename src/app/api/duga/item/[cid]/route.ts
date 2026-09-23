import { NextRequest } from 'next/server';
import { createValidationError } from '@/lib/api-config';
import { withApiErrorHandling } from '@/lib/api-helpers';
import { fetchItemDetailFromDuga } from '@/lib/duga-client';

export const revalidate = 604800;

async function handleDugaItemRequest(params: Promise<{ cid: string }>) {
  const { cid } = await params;

  if (!cid) {
    throw createValidationError('Content ID is required');
  }

  const item = await fetchItemDetailFromDuga(cid, 604800);
  if (!item) {
    throw createValidationError('Item not found');
  }

  return {
    item,
    status: 200,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const handler = withApiErrorHandling(
    async () => handleDugaItemRequest(params),
    {
      requireAuth: false,
      cache: {
        sMaxAge: 604800,
        staleWhileRevalidate: 1209600,
      },
    }
  );
  return handler(request);
}
