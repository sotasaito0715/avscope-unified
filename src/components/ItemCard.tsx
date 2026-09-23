'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';
import {
  getItemBlurDataURL,
  getResponsiveSizes,
  getOptimizedImageUrl,
  getImageQuality,
} from '@/lib/image-utils';
import { normalizePrice } from '@/lib/price-utils';
import { useAffiliateTracking } from '@/hooks/useAffiliateTracking';
import { formatDate } from '@/lib/date-utils';
import { hasVideo } from '@/lib/dmm-utils';
import { useFavorites } from '@/hooks/useFavorites';
import { catalogLabel, getActressHref, getCatalogSource, getItemHref, getVideoHref } from '@/lib/catalog';

interface ItemCardProps {
  item: DMMItem;
  priority?: boolean;
  relatedItems?: DMMItem[]; // 関連動画のリストを追加
  pageType?: 'item' | 'actress' | 'genre' | 'maker' | 'series'; // ページタイプ
  position?: number; // リスト内の位置
}

function ItemCard({ item, priority = false, pageType, position }: ItemCardProps) {
  const handleAffiliateClick = useAffiliateTracking(item, pageType, position, 'button');
  const { isFavorite, toggleItem, isHydrated } = useFavorites();

  const getMainActress = () => {
    if (item.iteminfo?.actress && item.iteminfo.actress.length > 0) {
      return item.iteminfo.actress[0];
    }
    return null;
  };

  const getActressCount = () => {
    return item.iteminfo?.actress?.length || 0;
  };

  const mainActress = getMainActress();
  const actressCount = getActressCount();
  const otherActressCount = actressCount > 1 ? actressCount - 1 : 0;

  const itemHasVideo = Boolean(getVideoHref(item) && hasVideo(item));
  const isFav = isFavorite(item.content_id);
  const itemHref = getItemHref(item);
  const videoHref = getVideoHref(item);
  const actressHref = mainActress ? getActressHref(item, mainActress.id) : null;
  const sourceLabel = catalogLabel(getCatalogSource(item));

  const handleFavoriteClick = () => {
    if (!isHydrated) return;
    toggleItem(item, 'item');
  };

  const normalizedPrice = normalizePrice(item.prices?.price);

  return (
    <>
      <div className="bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:bg-[#252525] transition-all duration-200" itemScope itemType="https://schema.org/Product">
        <Link href={itemHref}>
          <div className="relative aspect-[3/2] cursor-pointer bg-[#1a1a1a]">
            <span className="absolute top-2 left-2 z-10 rounded bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              {sourceLabel}
            </span>
            <Image
              src={getOptimizedImageUrl(item.imageURL, 'large')}
              alt={item.title}
              fill
              className="object-cover object-center transition-opacity duration-300"
              sizes={getResponsiveSizes('item')}
              quality={getImageQuality('thumbnail')}
              priority={priority}
              placeholder="blur"
              blurDataURL={getItemBlurDataURL()}
              loading={priority ? 'eager' : 'lazy'}
              itemProp="image"
            />
          </div>
        </Link>
        
        <div className="p-4">
          <Link href={itemHref}>
            <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem] text-gray-100 hover:text-blue-400 transition-colors cursor-pointer" itemProp="name">
              {item.title}
            </h3>
          </Link>
          
          <p className="text-xs mb-2 min-h-[1.25rem]">
            {mainActress ? (
              <>
                <span className="text-gray-400">出演: </span>
                {actressHref ? (
                <Link
                  href={actressHref}
                  className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                >
                  {mainActress.name}
                </Link>
                ) : (
                  <span className="text-gray-300">{mainActress.name}</span>
                )}
                {otherActressCount > 0 && (
                  <span className="text-gray-500 ml-1">
                    他{otherActressCount}名
                  </span>
                )}
              </>
            ) : (
              <span>&nbsp;</span>
            )}
          </p>
          
          <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
            <span>{formatDate(item.date, 'short')}</span>
          </div>
          
          <div className="space-y-2">
            {item.review?.count && item.review.count > 0 && (
              <span className="text-yellow-400 text-xs">
                ★ {parseFloat(item.review.average).toFixed(1)} ({item.review.count})
              </span>
            )}

            {itemHasVideo && videoHref && (
              <Link
                href={videoHref}
                prefetch={false}
                className="w-full bg-red-600 text-white px-3 py-2 rounded text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                無料動画を見る
              </Link>
            )}

            <Link
              href={item.affiliateURL || item.URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAffiliateClick}
              className="w-full bg-[#252525] text-gray-100 px-3 py-2 rounded text-xs hover:bg-[#333333] transition-colors flex items-center justify-center"
            >
              {sourceLabel}で見る
            </Link>

            <button
              onClick={handleFavoriteClick}
              disabled={!isHydrated}
              className={`w-full bg-[#252525] text-gray-100 px-3 py-2 rounded text-xs hover:bg-[#333333] transition-colors flex items-center justify-center gap-2 ${
                isFav ? 'text-red-400' : ''
              }`}
              aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
          </div>
          
          {/* 価格のmicrodata（視覚的には非表示） */}
          {normalizedPrice !== "0" && (
            <div hidden itemProp="offers" itemScope itemType="https://schema.org/Offer">
              <span itemProp="price" content={normalizedPrice}></span>
              <meta itemProp="priceCurrency" content="JPY" />
              <meta itemProp="availability" content="https://schema.org/InStock" />
              <link itemProp="url" href={item.affiliateURL || item.URL} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// React.memoでラップしてパフォーマンス最適化
export default memo(ItemCard);
