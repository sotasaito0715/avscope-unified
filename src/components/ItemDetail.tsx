'use client';

import type { DMMItem } from '@/types/dmm';
import Link from '@/components/ui/Link';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { useFavorites } from '@/hooks/useFavorites';
import { hasVideo } from '@/lib/dmm-utils';
import ItemDetailImageSection from './itemDetail/ItemDetailImageSection';
import ItemDetailInfoSection from './itemDetail/ItemDetailInfoSection';
import ItemDetailActressSection from './itemDetail/ItemDetailActressSection';
import ItemDetailGenreSection from './itemDetail/ItemDetailGenreSection';
import { catalogLabel, getCatalogSource, getVideoHref } from '@/lib/catalog';

interface ItemDetailProps {
  item: DMMItem;
  priceValue: number | undefined;
  relatedItems?: DMMItem[];
  isRelatedVideosLoading?: boolean;
  pageType?: 'item' | 'actress' | 'genre' | 'maker' | 'series';
  generatedDescription?: string;
  h2Title?: string;
}

export default function ItemDetail({ 
  item, 
  priceValue, 
  pageType = 'item',
  generatedDescription,
  h2Title = 'この作品の見どころ',
}: ItemDetailProps) {
  const handleAffiliateClick = useAffiliateTracking(item, pageType, 0, 'main');
  const { isFavorite, toggleItem, isHydrated } = useFavorites();
  const isFav = isFavorite(item.content_id);
  const itemHasVideo = Boolean(getVideoHref(item) && hasVideo(item));
  const sourceLabel = catalogLabel(getCatalogSource(item));

  const handleFavoriteClick = () => {
    if (!isHydrated) return;
    toggleItem(item, 'item');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-black text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側: 画像とサンプル */}
        <ItemDetailImageSection item={item} />

        {/* 右側: 詳細情報 */}
        <article className="space-y-6" itemScope itemType="https://schema.org/Product">
          {/* タイトル（デスクトップのみ表示） */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100" itemProp="name">
            {item.title}
          </h1>

          {/* 評価と価格 */}
          <div className="flex items-center gap-6">
            {item.review?.count > 0 && (
              <div className="text-yellow-400" itemProp="aggregateRating" itemScope itemType="https://schema.org/AggregateRating">
                <span aria-label={`評価 ${parseFloat(item.review.average).toFixed(1)} 点`}>
                  ★ <span itemProp="ratingValue">{parseFloat(item.review.average).toFixed(1)}</span>
                </span>
                {' '}(<span itemProp="reviewCount">{item.review.count}</span>件)
                <meta itemProp="bestRating" content="5" />
                <meta itemProp="worstRating" content="1" />
              </div>
            )}
            {/* 価格のmicrodata（視覚的には非表示） */}
            <div hidden itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <span itemProp="price" content={priceValue?.toString()}></span>
              <meta itemProp="priceCurrency" content="JPY" />
              <meta itemProp="availability" content="https://schema.org/InStock" />
              <link itemProp="url" href={item.affiliateURL || item.URL} />
            </div>
          </div>

          {/* 無料動画への導線（詳細→動画→購入ファネル） */}
          {itemHasVideo && getVideoHref(item) && (
            <Link
              href={getVideoHref(item)!}
              prefetch={false}
              className="block w-full bg-red-600 text-white text-center px-8 py-4 rounded-lg text-lg font-bold hover:bg-red-700 transition-colors"
              aria-label={`${item.title}の無料動画を再生`}
            >
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                無料動画を再生
              </span>
            </Link>
          )}

          {/* 自動生成された作品紹介テキスト（決定論ハッシュで見出しも分岐） */}
          {generatedDescription && (
            <section className="space-y-2 text-sm text-gray-200">
              <h2 className="text-lg font-semibold text-gray-100">
                {h2Title}
              </h2>
              <p className="leading-relaxed whitespace-pre-line">
                {generatedDescription}
              </p>
            </section>
          )}

          {/* 購入ボタン */}
          <a
            href={item.affiliateURL || item.URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAffiliateClick}
            className="block w-full bg-[#252525] text-gray-100 text-center px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#333333] transition-colors border border-red-600/60"
            aria-label={`${item.title}の${sourceLabel}ページへ移動`}
          >
            {sourceLabel}で見る
          </a>

          {/* お気に入りボタン */}
          <button
            onClick={handleFavoriteClick}
            disabled={!isHydrated}
            className={`w-full bg-[#252525] text-gray-100 px-8 py-4 rounded-lg text-lg font-bold hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 ${
              isFav ? 'text-red-400' : ''
            }`}
            aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 5.47l-.707-.707C9.81 3.586 7.32 2 4.5 2 1.903 2 0 3.903 0 6.5c0 2.412 1.723 4.43 4.15 6.01L12 22l7.85-9.49C22.277 10.93 24 8.912 24 6.5 24 3.903 22.097 2 19.5 2c-2.82 0-5.31 1.586-6.793 2.763L12 5.47z"
                clipRule="evenodd"
              />
            </svg>
            お気に入り
          </button>

          <a
            href="https://shiroto.avscope.jp/"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-[#333333] bg-[#121212] px-4 py-3 text-sm text-gray-300 hover:border-red-600/60 hover:text-gray-100 transition-colors"
          >
            素人作品を探す → 素人版AV Scope
          </a>

          {/* 基本情報 */}
          <ItemDetailInfoSection item={item} />

          {/* 出演者 */}
          <ItemDetailActressSection item={item} />

          {/* ジャンル */}
          <ItemDetailGenreSection item={item} />
        </article>
      </div>
    </div>
  );
}

