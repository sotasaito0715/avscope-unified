'use client';

import { useCallback } from 'react';
import { DMMItem } from '@/types/dmm';
import { trackAffiliateClick, type AffiliateClickPayload } from '@/lib/analytics';
import { getCatalogSource } from '@/lib/catalog';

type PageType = 'item' | 'actress' | 'genre' | 'maker' | 'series';

/**
 * アフィリエイトトラッキング用フック
 * @param item - DMMアイテム
 * @param pageType - ページタイプ
 * @param position - リスト内の位置（オプション）
 * @param linkType - リンクタイプ（オプション）
 * @returns アフィリエイトリンククリックハンドラー
 */
export function useAffiliateTracking(
  item: DMMItem,
  pageType?: PageType,
  position?: number,
  linkType?: 'main' | 'button' | 'banner'
) {
  return useCallback(() => {
    // ページタイプを新しい形式に変換
    const newPageType = pageType === 'item' ? 'detail' : 
                       pageType === 'actress' || pageType === 'genre' || pageType === 'maker' || pageType === 'series' ? 'list' :
                       undefined;

    const payload: AffiliateClickPayload = {
      item_id: item.content_id,
      item_title: item.title,
      price: item.prices?.price,
      actress: item.iteminfo?.actress?.[0]?.name,
      genre: item.iteminfo?.genre?.[0]?.name,
      page_type: newPageType,
      position,
      link_type: linkType || 'button',
      item_source: getCatalogSource(item),
    };

    trackAffiliateClick(payload);
  }, [item, pageType, position, linkType]);
}






