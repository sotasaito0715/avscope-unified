/**
 * DMMアイテム関連ユーティリティ
 * （server-only 依存なし・クライアント/サーバー共用）
 */

import type { ActressInfo, DMMItem } from '@/types/dmm';

/**
 * 無料動画が利用可能かチェック
 */
export function hasVideo(item: DMMItem): boolean {
  return !!(
    item.sampleMovieURL &&
    (item.sampleMovieURL.size_720_480 ||
      item.sampleMovieURL.size_644_414 ||
      item.sampleMovieURL.size_560_360 ||
      item.sampleMovieURL.size_476_306)
  );
}

/**
 * ActressInfo の形を揃える（互換用）
 */
export function convertActressInfo(actress: ActressInfo): ActressInfo {
  return {
    id: actress.id,
    name: actress.name,
    ruby: actress.ruby,
    bust: actress.bust,
    cup: actress.cup,
    waist: actress.waist,
    hip: actress.hip,
    height: actress.height,
    birthday: actress.birthday || null,
    blood_type: actress.blood_type || null,
    hobby: actress.hobby || null,
    prefectures: actress.prefectures || null,
    imageURL: actress.imageURL,
    listURL: actress.listURL,
  };
}

/**
 * 決定論的ハッシュ（ISRキャッシュ整合性のため Math.random を使わない）
 */
export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function deterministicShuffleItems(items: DMMItem[], seed: string): DMMItem[] {
  return [...items].sort((a, b) => {
    const hashA = hashString(`${seed}:${a.content_id}`);
    const hashB = hashString(`${seed}:${b.content_id}`);
    return hashA - hashB;
  });
}
