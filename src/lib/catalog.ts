import type { DMMItem } from '@/types/dmm';

export type CatalogSource = 'fanza' | 'duga';
export type CatalogTab = 'all' | CatalogSource;

export function isDugaItem(item: DMMItem | null | undefined): boolean {
  return item?.service_code === 'duga';
}

export function getCatalogSource(item: DMMItem): CatalogSource {
  return isDugaItem(item) ? 'duga' : 'fanza';
}

export function getItemHref(item: DMMItem): string {
  return isDugaItem(item) ? `/duga/item/${item.content_id}` : `/item/${item.content_id}`;
}

export function getVideoHref(item: DMMItem): string | null {
  if (isDugaItem(item)) return null;
  return `/video/item/${item.content_id}`;
}

export function getActressHref(item: DMMItem, actressId: string | number): string | null {
  if (isDugaItem(item)) return null;
  return `/actress/${actressId}`;
}

export function getGenreHref(item: DMMItem, genreId: string | number): string | null {
  if (isDugaItem(item)) return null;
  return `/genre/${genreId}`;
}

export function catalogLabel(source: CatalogSource): string {
  return source === 'duga' ? 'DUGA' : 'FANZA';
}

export function parseCatalogTab(value: string | null | undefined): CatalogTab {
  if (value === 'fanza' || value === 'duga' || value === 'all') return value;
  return 'all';
}
