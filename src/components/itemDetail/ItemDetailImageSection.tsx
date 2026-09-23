'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';
import ImageViewer from '../ImageViewer';
import { hasVideo } from '@/lib/dmm-utils';
import { getVideoHref } from '@/lib/catalog';

interface ItemDetailImageSectionProps {
  item: DMMItem;
  className?: string;
}

export default function ItemDetailImageSection({ item, className }: ItemDetailImageSectionProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const sampleImages = item.sampleImageURL?.sample_l?.image || [];
  const videoHref = getVideoHref(item);
  const itemHasVideo = Boolean(videoHref && hasVideo(item));

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
  };

  return (
    <>
      <div className={`space-y-6 ${className || ''}`}>
        {/* メイン画像 */}
        <figure className="relative aspect-[3/2] w-full bg-[#1a1a1a] rounded-lg overflow-hidden">
          <Image
            src={item.imageURL?.large || item.imageURL?.list || '/placeholder.jpg'}
            alt={`${item.title}のメイン画像`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            itemProp="image"
          />
        </figure>

        {/* タイトルは ItemDetail 側の h1 に統一（ページあたり h1 は1つのみ） */}

        {/* 無料動画 */}
        {itemHasVideo && (
          <section>
            <h2 className="text-xl font-bold text-gray-100 mb-4">無料動画</h2>
            <Link
              href={videoHref!}
              prefetch={false}
              className="relative w-full aspect-video bg-[#1a1a1a] rounded-lg overflow-hidden group cursor-pointer block ring-1 ring-red-600/40 hover:ring-red-500 transition-all"
            >
              <Image
                src={item.imageURL?.large || item.imageURL?.list || '/placeholder.jpg'}
                alt={`${item.title} 無料動画サムネイル`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {/* 再生ボタンオーバーレイ */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/45 group-hover:bg-black/55 transition-all">
                <div className="bg-red-600 rounded-full p-4 group-hover:scale-110 transition-transform shadow-lg shadow-red-900/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                <span className="bg-red-600 px-3 py-1.5 rounded text-white text-sm font-semibold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 inline mr-1"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  無料動画を再生
                </span>
                <span className="bg-black/70 px-3 py-1.5 rounded text-white/90 text-xs self-center">
                  縦スワイプで関連作品へ
                </span>
              </div>
            </Link>
          </section>
        )}

        {/* サンプル画像 */}
        {sampleImages.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-100 mb-4">サンプル画像</h2>
            <div className="grid grid-cols-2 gap-3" role="list">
              {sampleImages.map((imageUrl, index) => (
                <figure
                  key={index}
                  className="relative aspect-[3/2] bg-[#1a1a1a] rounded overflow-hidden cursor-pointer"
                  role="listitem"
                  onClick={() => handleImageClick(index)}
                >
                  <Image
                    src={imageUrl}
                    alt={`${item.title} サンプル画像 ${index + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    loading="lazy"
                  />
                  {/* 拡大アイコン */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-40">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 画像ビューワー */}
      <ImageViewer
        images={sampleImages}
        initialIndex={selectedImageIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={item.title}
      />
    </>
  );
}


