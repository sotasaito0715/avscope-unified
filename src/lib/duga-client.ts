/**
 * DUGA ウェブサービス API クライアント
 */

import { getApiCredentials, getApiHeaders, buildParams } from '@/lib/duga-config';
import { adaptDugaSearchResponse } from '@/lib/duga-adapter';
import type { DMMItem } from '@/types/dmm';
import type { DugaSearchParams, DugaSearchResponse } from '@/types/duga';
import type { FetchItemsParams } from '@/types/dmm';

export const DUGA_SEARCH_URL = 'http://affapi.duga.jp/search';

/**
 * アプリの sort 値を DUGA sort 値に変換
 */
export function mapSortToDuga(sort?: string): string {
  const sortMap: Record<string, string> = {
    rank: 'favorite',
    date: 'release',
    '-date': 'release',
    price: 'price',
    '-price': 'price',
    review: 'rating',
    match: 'favorite',
    new: 'new',
    favorite: 'favorite',
    release: 'release',
    rating: 'rating',
    mylist: 'mylist',
  };

  return sortMap[sort || 'rank'] || 'favorite';
}

/**
 * FetchItemsParams を DUGA API パラメータに変換
 */
export function mapFetchParamsToDuga(
  params: FetchItemsParams & { offset?: number },
  credentials: NonNullable<ReturnType<typeof getApiCredentials>>
): DugaSearchParams {
  const hits = params.hits || 60;
  const offset = params.offset ?? (params.page ? (params.page > 1 ? (params.page - 1) * hits + 1 : 1) : 1);

  const dugaParams: DugaSearchParams = {
    version: credentials.version,
    appid: credentials.appId,
    agentid: credentials.agentId,
    bannerid: credentials.bannerId,
    format: 'json',
    adult: '1',
    hits,
    offset,
    sort: mapSortToDuga(params.sort),
  };

  if (params.keyword) {
    dugaParams.keyword = params.keyword;
  }

  if (params.article && params.article_id) {
    switch (params.article) {
      case 'actress':
        dugaParams.performerid = params.article_id;
        break;
      case 'genre':
        dugaParams.category = params.article_id;
        break;
      case 'series':
        dugaParams.seriesid = params.article_id;
        break;
      default:
        break;
    }
  }

  return dugaParams;
}

/**
 * DUGA 検索 API を呼び出す
 */
export async function fetchDugaSearch(
  params: DugaSearchParams,
  revalidate = 172800
): Promise<DugaSearchResponse> {
  const searchParams = new URLSearchParams();
  const normalizedParams = buildParams(
    Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, value?.toString()])
    )
  );

  Object.entries(normalizedParams).forEach(([key, value]) => {
    searchParams.set(key, value);
  });

  const url = `${DUGA_SEARCH_URL}?${searchParams.toString()}`;

  const response = await fetch(url, {
    headers: getApiHeaders(),
    next: { revalidate },
    cache: 'force-cache',
  });

  if (!response.ok) {
    throw new Error(`DUGA API returned status ${response.status}`);
  }

  return response.json();
}

const SHIROTO_ORIGIN = process.env.DUGA_PROXY_ORIGIN || 'https://shiroto.avscope.jp';

async function fetchItemsViaShirotoProxy(
  params: FetchItemsParams & { offset?: number },
  revalidate: number
): Promise<{ items: DMMItem[]; total_count: number }> {
  const hits = params.hits || 60;
  const offset = params.offset ?? (params.page ? (params.page > 1 ? (params.page - 1) * hits + 1 : 1) : 1);
  const searchParams = new URLSearchParams();
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.keyword) searchParams.set('keyword', params.keyword);
  searchParams.set('hits', String(hits));
  searchParams.set('offset', String(offset));
  if (params.article) searchParams.set('article', params.article);
  if (params.article_id) searchParams.set('article_id', params.article_id);

  const response = await fetch(`${SHIROTO_ORIGIN}/api/items?${searchParams.toString()}`, {
    next: { revalidate },
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`DUGA proxy returned status ${response.status}`);
  }

  const data = (await response.json()) as {
    items?: DMMItem[];
    total_count?: string | number;
  };

  return {
    items: data.items || [],
    total_count:
      typeof data.total_count === 'string' ? parseInt(data.total_count, 10) : data.total_count || 0,
  };
}

async function fetchItemDetailViaShirotoProxy(
  productId: string,
  revalidate: number
): Promise<DMMItem | null> {
  const response = await fetch(`${SHIROTO_ORIGIN}/api/item/${encodeURIComponent(productId)}`, {
    next: { revalidate },
    headers: { Accept: 'application/json' },
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`DUGA proxy returned status ${response.status}`);
  }

  const data = (await response.json()) as { item?: DMMItem };
  return data.item || null;
}

/**
 * 作品一覧を DUGA API から取得し DMMItem 形式で返す。
 * 本番シークレットが無い試験環境では shiroto.avscope.jp の API を経由する。
 */
export async function fetchItemsFromDuga(
  params: FetchItemsParams & { offset?: number },
  revalidate = 172800
): Promise<{ items: DMMItem[]; total_count: number }> {
  const credentials = getApiCredentials();
  if (!credentials) {
    try {
      return await fetchItemsViaShirotoProxy(params, revalidate);
    } catch (error) {
      console.error('DUGA proxy search failed:', error);
      return { items: [], total_count: 0 };
    }
  }

  const dugaParams = mapFetchParamsToDuga(params, credentials);
  const response = await fetchDugaSearch(dugaParams, revalidate);
  const adapted = adaptDugaSearchResponse(response);

  // DUGA は降順ソート非対応のため、必要な場合のみクライアント側で再ソート
  if (params.sort === '-price') {
    adapted.items.sort((a, b) => {
      const priceA = parseInt((a.prices?.price || '0').replace(/\D/g, ''), 10) || 0;
      const priceB = parseInt((b.prices?.price || '0').replace(/\D/g, ''), 10) || 0;
      return priceA - priceB;
    });
  }

  return adapted;
}

/**
 * 作品詳細を productid で取得
 */
export async function fetchItemDetailFromDuga(
  productId: string,
  revalidate = 604800
): Promise<DMMItem | null> {
  const credentials = getApiCredentials();
  if (!credentials) {
    try {
      return await fetchItemDetailViaShirotoProxy(productId, revalidate);
    } catch (error) {
      console.error('DUGA proxy detail failed:', error);
      return null;
    }
  }

  const response = await fetchDugaSearch(
    {
      version: credentials.version,
      appid: credentials.appId,
      agentid: credentials.agentId,
      bannerid: credentials.bannerId,
      format: 'json',
      adult: '1',
      keyword: productId,
      hits: 20,
      offset: 1,
      sort: 'favorite',
    },
    revalidate
  );

  const { items } = adaptDugaSearchResponse(response);
  const exactMatch = items.find(
    (item) => item.content_id === productId || item.product_id === productId
  );

  return exactMatch || items[0] || null;
}
