/**
 * DUGA API レスポンス → アプリ内部モデル（DMMItem）変換
 */

import type { DMMItem } from '@/types/dmm';
import type {
  DugaItem,
  DugaNamedEntity,
  DugaPerformerEntity,
  DugaSaleTypeEntry,
  DugaSearchResponse,
} from '@/types/duga';

function toArray<T>(value: T | T[] | undefined | null): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: string | number | undefined): number {
  if (value === undefined || value === null || value === '') return 0;
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toStringId(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function normalizeDate(value?: string): string {
  if (!value) return '';
  return value.replace(/\//g, '-');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseImageSizes(value: unknown): { small?: string; midium?: string; large?: string } {
  const result: { small?: string; midium?: string; large?: string } = {};

  if (!value) return result;

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      if (!isRecord(entry)) return;
      if (typeof entry.small === 'string') result.small = entry.small;
      if (typeof entry.midium === 'string') result.midium = entry.midium;
      if (typeof entry.large === 'string') result.large = entry.large;
    });
    return result;
  }

  if (isRecord(value)) {
    if (typeof value.small === 'string') result.small = value.small;
    if (typeof value.midium === 'string') result.midium = value.midium;
    if (typeof value.large === 'string') result.large = value.large;
  }

  return result;
}

/**
 * thumbnail.image の noauth キャプチャ URL を通常キャプチャ URL に差し替える。
 * 例: .../noauth/scap/0002.jpg → .../cap/0002.jpg
 */
function rewriteThumbnailUrl(url: string): string {
  return url.replace('/noauth/scap/', '/cap/');
}

function extractThumbnailImages(thumbnail: unknown): string[] {
  if (!thumbnail) return [];

  if (Array.isArray(thumbnail)) {
    return thumbnail
      .map((entry) => (isRecord(entry) && typeof entry.image === 'string' ? entry.image : null))
      .filter((url): url is string => Boolean(url))
      .map(rewriteThumbnailUrl);
  }

  if (isRecord(thumbnail) && thumbnail.image) {
    return toArray(thumbnail.image as string | string[])
      .filter(Boolean)
      .map(rewriteThumbnailUrl);
  }

  return [];
}

function extractSampleMovieUrl(samplemovie: unknown): string {
  if (!samplemovie) return '';

  const extractFromRecord = (record: Record<string, unknown>): string => {
    if (typeof record.movie === 'string') return record.movie;

    for (const value of Object.values(record)) {
      if (isRecord(value) && typeof value.movie === 'string') {
        return value.movie;
      }
    }

    return '';
  };

  if (Array.isArray(samplemovie)) {
    for (const entry of samplemovie) {
      if (!isRecord(entry)) continue;
      const url = extractFromRecord(entry);
      if (url) return url;
    }
    return '';
  }

  if (isRecord(samplemovie)) {
    return extractFromRecord(samplemovie);
  }

  return '';
}

function parseNamedEntities(value: unknown): DugaNamedEntity[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!isRecord(entry)) return [];

      if (entry.data) {
        return parseNamedEntities(entry.data);
      }

      if (entry.id !== undefined || entry.name) {
        return [{
          id: entry.id as string | number | undefined,
          name: typeof entry.name === 'string' ? entry.name : undefined,
        }];
      }

      return [];
    });
  }

  if (isRecord(value)) {
    if (value.data) {
      return parseNamedEntities(value.data);
    }

    if (value.id !== undefined || value.name) {
      return [{
        id: value.id as string | number | undefined,
        name: typeof value.name === 'string' ? value.name : undefined,
      }];
    }
  }

  return [];
}

function parsePerformers(value: unknown): DugaPerformerEntity[] {
  if (!value) return [];

  const mapPerformer = (entry: Record<string, unknown>): DugaPerformerEntity => ({
    id: entry.id as string | number | undefined,
    name: typeof entry.name === 'string' ? entry.name : undefined,
    kana: typeof entry.kana === 'string' ? entry.kana : undefined,
  });

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!isRecord(entry)) return [];
      if (entry.data) {
        return parsePerformers(entry.data);
      }
      if (entry.id !== undefined || entry.name) {
        return [mapPerformer(entry)];
      }
      return [];
    });
  }

  if (isRecord(value)) {
    if (value.data) {
      return parsePerformers(value.data);
    }
    if (value.id !== undefined || value.name) {
      return [mapPerformer(value)];
    }
  }

  return [];
}

function parseSeries(value: unknown): DugaNamedEntity[] {
  return parseNamedEntities(value);
}

function parseLabel(value: unknown): DugaNamedEntity[] {
  return parseNamedEntities(value);
}

function parseSaleTypes(value: unknown): DugaSaleTypeEntry[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((entry) => {
      if (!isRecord(entry)) return [];
      if (entry.data) {
        return parseSaleTypes(entry.data);
      }
      if (entry.type || entry.price !== undefined) {
        return [{
          type: typeof entry.type === 'string' ? entry.type : undefined,
          price: entry.price as string | number | undefined,
        }];
      }
      return [];
    });
  }

  if (isRecord(value)) {
    if (value.data) {
      return parseSaleTypes(value.data);
    }
    if (value.type || value.price !== undefined) {
      return [{
        type: typeof value.type === 'string' ? value.type : undefined,
        price: value.price as string | number | undefined,
      }];
    }
  }

  return [];
}

/**
 * DUGA API の review フィールドをパースする
 * JSON では [{ rating, reviewer }] 配列、または { rating, reviewer } オブジェクトで返る
 * - rating: 平均評価（5点満点）
 * - reviewer: レビュー数
 */
function parseReview(value: unknown): { count: number; average: string } {
  if (!value) {
    return { count: 0, average: '0' };
  }

  const entries = Array.isArray(value) ? value : [value];

  for (const entry of entries) {
    if (!isRecord(entry)) continue;
    if (entry.rating === undefined && entry.reviewer === undefined) continue;

    const count = toNumber(entry.reviewer as string | number | undefined);
    const average =
      entry.rating !== undefined && entry.rating !== null && entry.rating !== ''
        ? String(entry.rating)
        : '0';

    return { count, average };
  }

  return { count: 0, average: '0' };
}

function mapNamedEntities(
  entities: DugaNamedEntity[],
  rubyField?: 'ruby' | 'kana'
): { id: number; name: string; ruby: string }[] {
  return entities.map((entity) => ({
    id: toNumber(entity.id) || hashString(entity.name || ''),
    name: entity.name || '',
    ruby: rubyField === 'kana' ? (entity as DugaPerformerEntity).kana || '' : '',
  }));
}

function mapPerformers(performers: DugaPerformerEntity[]): DMMItem['iteminfo']['actress'] {
  return performers.map((performer) => ({
    id: toNumber(performer.id) || hashString(performer.name || ''),
    name: performer.name || '',
    ruby: performer.kana || '',
  }));
}

function buildSampleMovieUrls(movieUrl?: string): DMMItem['sampleMovieURL'] {
  const url = movieUrl || '';
  return {
    size_476_306: url,
    size_560_360: url,
    size_644_414: url,
    size_720_480: url,
    pc_flag: url ? 1 : 0,
    sp_flag: url ? 1 : 0,
  };
}

function buildPrices(item: DugaItem): DMMItem['prices'] {
  const saleTypes = parseSaleTypes(item.saletype);
  const lowestSalePrice = saleTypes.reduce<number | null>((min, entry) => {
    const price = toNumber(entry.price);
    if (price <= 0) return min;
    return min === null || price < min ? price : min;
  }, null);

  const price = item.price || (lowestSalePrice !== null ? `${lowestSalePrice}円` : '');

  return {
    price,
    list_price: price,
    deliveries: {
      delivery: saleTypes.map((entry) => ({
        type: entry.type || '',
        price: entry.price !== undefined ? String(entry.price) : '',
        list_price: entry.price !== undefined ? String(entry.price) : '',
      })),
    },
  };
}

function buildMakerInfo(item: DugaItem): DMMItem['iteminfo']['maker'] {
  if (!item.makername) return [];

  const labels = parseLabel(item.label);
  const labelId = labels[0]?.id ? toNumber(labels[0].id) : 0;

  return [{
    id: labelId || hashString(item.makername),
    name: item.makername,
  }];
}

function buildImageUrls(item: DugaItem): DMMItem['imageURL'] {
  const jacket = parseImageSizes(item.jacketimage);
  const poster = parseImageSizes(item.posterimage);

  return {
    large: jacket.large || poster.large || jacket.midium || poster.midium || '',
    list: jacket.midium || poster.midium || jacket.small || poster.small || '',
    small: jacket.small || poster.small || '',
  };
}

export function getDugaItemImageUrl(
  item: DugaItem,
  size: 'large' | 'list' | 'small' = 'large'
): string {
  const urls = buildImageUrls(item);
  return urls[size] || urls.large || urls.list || urls.small || '';
}

export { parsePerformers };

export function adaptDugaItemToDMMItem(item: DugaItem): DMMItem {
  const productId = item.productid || item.itemno || '';
  const performers = parsePerformers(item.performer);
  const categories = parseNamedEntities(item.category);
  const directors = parseNamedEntities(item.director);
  const seriesList = parseSeries(item.series);
  const labelList = parseLabel(item.label);
  const thumbnailImages = extractThumbnailImages(item.thumbnail);
  const sampleMovieUrl = extractSampleMovieUrl(item.samplemovie);
  const review = parseReview(item.review);

  return {
    service_code: 'duga',
    service_name: 'DUGA',
    floor_code: 'ppv',
    floor_name: 'PPV',
    category_name: categories[0]?.name || '',
    content_id: productId,
    product_id: productId,
    title: item.title || '',
    caption: item.caption?.trim() || '',
    volume: item.volume !== undefined ? String(item.volume) : '',
    review,
    URL: item.url || '',
    affiliateURL: item.affiliateurl || item.url || '',
    imageURL: buildImageUrls(item),
    sampleImageURL: {
      sample_s: { image: thumbnailImages },
      sample_l: { image: thumbnailImages },
    },
    sampleMovieURL: buildSampleMovieUrls(sampleMovieUrl),
    prices: buildPrices(item),
    date: normalizeDate(item.releasedate || item.opendate),
    iteminfo: {
      genre: mapNamedEntities(categories),
      series: seriesList[0]
        ? [{ id: toNumber(seriesList[0].id), name: seriesList[0].name || '' }]
        : [],
      maker: buildMakerInfo(item),
      label: labelList[0]
        ? [{ id: toNumber(labelList[0].id) || hashString(labelList[0].name || ''), name: labelList[0].name || '' }]
        : [],
      actress: mapPerformers(performers),
      director: mapNamedEntities(directors),
      author: [],
    },
  };
}

function unwrapDugaItem(entry: { item?: DugaItem } | DugaItem): DugaItem | null {
  if ('item' in entry && entry.item) {
    return entry.item;
  }

  if ('productid' in entry || 'title' in entry) {
    return entry;
  }

  return null;
}

export function extractDugaItems(response: DugaSearchResponse): DugaItem[] {
  if (!response.items) return [];

  return response.items
    .map((entry) => unwrapDugaItem(entry))
    .filter((item): item is DugaItem => item !== null);
}

export function adaptDugaSearchResponse(response: DugaSearchResponse): {
  items: DMMItem[];
  total_count: number;
} {
  const dugaItems = extractDugaItems(response);

  return {
    items: dugaItems.map(adaptDugaItemToDMMItem),
    total_count: toNumber(response.count),
  };
}

export function buildActressInfoFromPerformer(
  performer: DugaPerformerEntity,
  jacketImage?: string
): import('@/types/dmm').ActressInfo {
  return {
    id: toStringId(performer.id) || toStringId(hashString(performer.name || '')),
    name: performer.name || '',
    ruby: performer.kana || '',
    bust: '',
    cup: '',
    waist: '',
    hip: '',
    height: '',
    birthday: null,
    blood_type: null,
    hobby: null,
    prefectures: null,
    imageURL: jacketImage
      ? { large: jacketImage, small: jacketImage }
      : undefined,
  };
}
