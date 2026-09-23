/**
 * DMM API 直接呼び出し（サーバー専用）
 *
 * ページの SSG/ISR と /api プロキシの両方から利用する。
 * 自前 /api への HTTP 自己呼び出しは行わない。
 */

import 'server-only';

import { normalizePrice } from '@/lib/price-utils';
import { logError } from '@/lib/logger';
import { rateLimitedPromiseAll } from '@/lib/api-rate-limit';
import {
  getApiCredentials,
  getApiHeaders,
  buildItemListUrl,
  buildActressSearchUrl,
  getItemListBaseParams,
  getBaseApiParams,
  buildParams,
} from '@/lib/api-config';
import type { DMMItem, ActressInfo, FetchItemsParams, FetchActressParams } from '@/types/dmm';

const DEFAULT_ITEM_REVALIDATE = 172800; // 48時間
const DEFAULT_ACTRESS_REVALIDATE = 172800; // 48時間
const DEFAULT_ITEM_DETAIL_REVALIDATE = 604800; // 1週間
const DEFAULT_ITEMS_BY_IDS_REVALIDATE = 86400; // 24時間

function normalizeItemPrices(item: DMMItem): DMMItem {
  return {
    ...item,
    prices: {
      ...item.prices,
      price: normalizePrice(item.prices?.price),
      list_price: normalizePrice(item.prices?.list_price),
      deliveries: {
        ...item.prices?.deliveries,
        delivery:
          item.prices?.deliveries?.delivery?.map((delivery) => ({
            ...delivery,
            price: normalizePrice(delivery.price),
            list_price: normalizePrice(delivery.list_price),
          })) || [],
      },
    },
  };
}

function calculateOffset(page: number, hits: number): number {
  return page > 1 ? (page - 1) * hits + 1 : 1;
}

export type ItemListQuery = FetchItemsParams & {
  /** DMM API の 1始まり offset（page より優先） */
  offset?: number;
};

export type ItemListResult = {
  items: DMMItem[];
  total_count: number;
  first_position?: string;
  result_count?: string;
  status?: number;
};

export type ActressSearchResult = {
  actress: ActressInfo[];
  total_count: number;
  first_position?: string;
  result_count?: string;
};

/**
 * ItemList を DMM から直接取得
 */
export async function queryItemList(
  params: ItemListQuery = {},
  revalidate: number = DEFAULT_ITEM_REVALIDATE
): Promise<ItemListResult> {
  const credentials = getApiCredentials();
  if (!credentials) {
    logError('DMM API credentials not found');
    return { items: [], total_count: 0 };
  }

  const hits = params.hits || 60;
  const offset =
    params.offset !== undefined
      ? params.offset === 0
        ? 1
        : params.offset
      : params.page
        ? calculateOffset(params.page, hits)
        : 1;
  const sort = params.sort || 'rank';
  const keyword = params.keyword || '';
  const article = params.article || '';
  const articleId = params.article_id || '';
  const articleIds = articleId
    ? articleId.split(',').map((id) => id.trim()).filter(Boolean)
    : [];

  // 複数 article_id は並列取得して結合
  if (articleIds.length > 1 && article) {
    const itemPromises = articleIds.map(async (id) => {
      const url = buildItemListUrl(
        buildParams({
          ...getItemListBaseParams(credentials),
          sort,
          hits: hits.toString(),
          offset: offset.toString(),
          keyword,
          article,
          article_id: id,
        })
      );
      const response = await fetch(url, {
        headers: getApiHeaders(),
        next: { revalidate },
      });
      if (!response.ok) {
        throw new Error(`DMM API returned status ${response.status}`);
      }
      const data = await response.json();
      return (data.result?.items || []) as DMMItem[];
    });

    const results = await Promise.all(itemPromises);
    const allItems = results.flat();
    const uniqueItems = allItems.filter(
      (item, index, self) =>
        index === self.findIndex((i) => i.content_id === item.content_id)
    );
    const normalized = uniqueItems.map(normalizeItemPrices);

    return {
      items: normalized,
      total_count: normalized.length,
      first_position: '1',
      result_count: normalized.length.toString(),
      status: 200,
    };
  }

  const url = buildItemListUrl(
    buildParams({
      ...getItemListBaseParams(credentials),
      sort,
      hits: hits.toString(),
      offset: offset.toString(),
      keyword,
      article,
      article_id: articleIds.length === 1 ? articleIds[0] : articleId,
    })
  );

  const response = await fetch(url, {
    headers: getApiHeaders(),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`DMM API returned status ${response.status}`);
  }

  const data = await response.json();
  const items = ((data.result?.items || []) as DMMItem[]).map(normalizeItemPrices);

  return {
    items,
    total_count: parseInt(data.result?.total_count || '0', 10),
    first_position: data.result?.first_position,
    result_count: data.result?.result_count,
    status: data.result?.status,
  };
}

/**
 * 単一作品を cid で取得
 */
export async function queryItemByCid(
  cid: string,
  revalidate: number = DEFAULT_ITEM_DETAIL_REVALIDATE
): Promise<DMMItem | null> {
  const credentials = getApiCredentials();
  if (!credentials) {
    logError('DMM API credentials not found');
    return null;
  }

  const url = buildItemListUrl(
    buildParams({
      ...getItemListBaseParams(credentials),
      cid,
    })
  );

  const response = await fetch(url, {
    headers: getApiHeaders(),
    next: { revalidate },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`DMM API returned status ${response.status}`);
  }

  const data = await response.json();
  if (data.result?.items?.length > 0) {
    return normalizeItemPrices(data.result.items[0]);
  }
  return null;
}

/**
 * 複数作品を cid 一覧で取得（レート制限付き）
 */
export async function queryItemsByCids(
  contentIds: string[],
  revalidate: number = DEFAULT_ITEMS_BY_IDS_REVALIDATE
): Promise<DMMItem[]> {
  if (contentIds.length === 0) return [];

  const credentials = getApiCredentials();
  if (!credentials) {
    logError('DMM API credentials not found');
    return [];
  }

  const itemTasks = contentIds.map((cid) => async () => {
    try {
      return await queryItemByCid(cid, revalidate);
    } catch (error) {
      console.error(`Error fetching item ${cid}:`, error);
      return null;
    }
  });

  const items = await rateLimitedPromiseAll(itemTasks, {
    maxConcurrency: 1,
    delay: 100,
  });

  return items.filter((item): item is DMMItem => item !== null);
}

/**
 * ActressSearch を DMM から直接取得
 */
export async function queryActressSearch(
  params: FetchActressParams = {},
  revalidate: number = DEFAULT_ACTRESS_REVALIDATE
): Promise<ActressSearchResult> {
  const credentials = getApiCredentials();
  if (!credentials) {
    logError('DMM API credentials not found');
    return { actress: [], total_count: 0 };
  }

  const actressId = params.actress_id || '';
  const actressIds = actressId
    ? actressId.split(',').map((id) => id.trim()).filter(Boolean)
    : [];
  const keyword = params.keyword || '';
  const sort = params.sort || '';
  const hits = params.hits?.toString() || '';
  const offset = params.offset?.toString() || '';

  const hasParams =
    actressId ||
    keyword ||
    params.gte_bust ||
    params.lte_bust ||
    params.gte_waist ||
    params.lte_waist ||
    params.gte_hip ||
    params.lte_hip ||
    params.gte_height ||
    params.lte_height ||
    params.gte_birthday ||
    params.lte_birthday;

  if (!hasParams) {
    return { actress: [], total_count: 0 };
  }

  const baseParams = getBaseApiParams(credentials);

  if (actressIds.length > 1) {
    const actressPromises = actressIds.map(async (id) => {
      const url = buildActressSearchUrl(
        buildParams({
          ...baseParams,
          actress_id: id,
          sort: sort || '-id',
          hits: hits || '100',
          offset: offset || '1',
        })
      );
      const response = await fetch(url, {
        headers: getApiHeaders(),
        next: { revalidate },
      });
      if (!response.ok) {
        throw new Error(`DMM API returned status ${response.status}`);
      }
      const data = await response.json();
      return (data.result?.actress || []) as ActressInfo[];
    });

    const results = await Promise.all(actressPromises);
    const allActresses = results.flat();
    const uniqueActresses = allActresses.filter(
      (actress, index, self) =>
        index === self.findIndex((a) => a.id === actress.id)
    );

    return {
      actress: uniqueActresses,
      total_count: uniqueActresses.length,
      first_position: '1',
      result_count: uniqueActresses.length.toString(),
    };
  }

  const additionalParams: Record<string, string | undefined> = {
    actress_id: actressIds.length === 1 ? actressIds[0] : actressId || undefined,
    keyword: keyword || undefined,
    sort: sort || '-id',
    hits: hits || '100',
    offset: offset || undefined,
    gte_bust: params.gte_bust,
    lte_bust: params.lte_bust,
    gte_waist: params.gte_waist,
    lte_waist: params.lte_waist,
    gte_hip: params.gte_hip,
    lte_hip: params.lte_hip,
    gte_height: params.gte_height,
    lte_height: params.lte_height,
    gte_birthday: params.gte_birthday,
    lte_birthday: params.lte_birthday,
  };

  const url = buildActressSearchUrl(
    buildParams({
      ...baseParams,
      ...additionalParams,
    })
  );

  const response = await fetch(url, {
    headers: getApiHeaders(),
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`DMM API returned status ${response.status}`);
  }

  const data = await response.json();
  const actress = (data.result?.actress || []) as ActressInfo[];

  return {
    actress,
    total_count: parseInt(data.result?.total_count || '0', 10),
    first_position: data.result?.first_position,
    result_count: data.result?.result_count,
  };
}
