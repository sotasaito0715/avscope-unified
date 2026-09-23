'use client';

import { useState } from 'react';
import type { DMMItem as DMMItemLib } from '@/types/dmm';
import { DMMItem as DMMItemType } from '@/types/dmm';
import ItemDetail from './ItemDetail';
import RelatedVideosSection from './RelatedVideosSection';

// 環境変数を直接読み込む（クライアントコンポーネント用）
// デフォルトは 'false'（OFF）
const ENABLE_RELATED_ITEMS = (process.env.NEXT_PUBLIC_ENABLE_RELATED_ITEMS || 'false') === 'true';

interface ItemDetailWithRelatedVideosProps {
  item: DMMItemLib;
  priceValue: number | undefined;
  pageType?: 'item' | 'actress' | 'genre' | 'maker' | 'series';
  generatedDescription?: string;
  h2Title?: string;
}

/**
 * ItemDetailと関連動画を統合したコンポーネント
 * 関連動画を取得し、ItemDetailとVideoModalに渡す
 */
export default function ItemDetailWithRelatedVideos({
  item,
  priceValue,
  pageType = 'item',
  generatedDescription,
  h2Title,
}: ItemDetailWithRelatedVideosProps) {
  const [relatedVideos, setRelatedVideos] = useState<DMMItemLib[]>([]);
  const [isRelatedVideosLoading, setIsRelatedVideosLoading] = useState(false);

  const handleRelatedVideosFetched = (items: DMMItemType[]) => {
    // @/types/dmm の DMMItem を @/lib/dmm の DMMItem に型アサーション
    // 実際には互換性があるため、型アサーションで対応
    setRelatedVideos(items as unknown as DMMItemLib[]);
  };

  const handleLoadingStateChange = (isLoading: boolean) => {
    setIsRelatedVideosLoading(isLoading);
  };

  return (
    <>
      <ItemDetail
        item={item}
        priceValue={priceValue}
        relatedItems={relatedVideos}
        isRelatedVideosLoading={isRelatedVideosLoading}
        pageType={pageType}
        generatedDescription={generatedDescription}
        h2Title={h2Title}
      />
      {ENABLE_RELATED_ITEMS && (
        <RelatedVideosSection
          currentItem={item}
          maxCount={8}
          onItemsFetched={handleRelatedVideosFetched}
          onLoadingStateChange={handleLoadingStateChange}
          showTitle={true}
        />
      )}
    </>
  );
}

