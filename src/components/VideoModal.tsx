'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';

interface VideoModalProps {
  item: DMMItem;
  isOpen: boolean;
  onClose: () => void;
  relatedItems?: DMMItem[];
  isRelatedVideosLoading?: boolean; // RelatedVideosSectionが取得中かどうか
}

export default function VideoModal({ item, isOpen, onClose, relatedItems = [], isRelatedVideosLoading = false }: VideoModalProps) {
  const [fetchedRelatedItems, setFetchedRelatedItems] = useState<DMMItem[]>([]);
  const [isLoadingRelatedItems, setIsLoadingRelatedItems] = useState(false);

  // デバイスによって適切な動画サイズを取得（キャッシュバスター付き）
  const getVideoUrl = (targetItem: DMMItem = currentItem) => {
    const sampleMovieURL = targetItem.sampleMovieURL;
    if (!sampleMovieURL) return null;

    // 画面幅を取得
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;

    let videoUrl = null;
    // デバイスサイズに応じて最適な動画サイズを選択
    if (screenWidth >= 1280) {
      // デスクトップ (XL以上) - 最高画質
      videoUrl = (
        sampleMovieURL.size_720_480 ||
        sampleMovieURL.size_644_414 ||
        sampleMovieURL.size_560_360 ||
        sampleMovieURL.size_476_306 ||
        null
      );
    } else if (screenWidth >= 768) {
      // タブレット (MD-LG) - 中画質
      videoUrl = (
        sampleMovieURL.size_644_414 ||
        sampleMovieURL.size_560_360 ||
        sampleMovieURL.size_720_480 ||
        sampleMovieURL.size_476_306 ||
        null
      );
    } else {
      // スマホ (SM以下) - 低画質（データ節約）
      videoUrl = (
        sampleMovieURL.size_476_306 ||
        sampleMovieURL.size_560_360 ||
        sampleMovieURL.size_644_414 ||
        sampleMovieURL.size_720_480 ||
        null
      );
    }

    return videoUrl;
  };

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<DMMItem>(item);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 動画リスト（現在の動画 + propsの関連動画 + CSRで取得した関連動画）
  const allItems = [item, ...relatedItems, ...fetchedRelatedItems];

  // 関連動画をCSRで取得する関数
  const fetchRelatedItems = async () => {
    // 既に取得済みの場合はスキップ
    if (fetchedRelatedItems.length > 0 || isLoadingRelatedItems) {
      return;
    }

    setIsLoadingRelatedItems(true);

    try {
      // 女優からランダムに1つ選ぶ
      const actresses = item.iteminfo?.actress || [];
      let selectedArticleType: 'actress' | 'genre' | null = null;
      let selectedArticleId: string | null = null;

      if (actresses.length > 0) {
        // ランダムに女優を1つ選ぶ
        const randomActress = actresses[Math.floor(Math.random() * actresses.length)];
        selectedArticleType = 'actress';
        selectedArticleId = randomActress.id.toString();
      } else {
        // 女優がいない場合はジャンルからランダムに1つ選ぶ
        const genres = item.iteminfo?.genre || [];
        if (genres.length > 0) {
          const randomGenre = genres[Math.floor(Math.random() * genres.length)];
          selectedArticleType = 'genre';
          selectedArticleId = randomGenre.id.toString();
        }
      }

      // 取得対象が決まった場合のみAPIを呼ぶ
      if (selectedArticleType && selectedArticleId) {
        const response = await fetch(
          `/api/items?article=${selectedArticleType}&article_id=${selectedArticleId}&hits=60&sort=rank`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch related items: ${response.status}`);
        }

        const data = await response.json();
        const fetchedItems: DMMItem[] = data.items || [];

        // 現在の作品を除外し、無料動画がある作品のみに絞る
        const filteredItems = fetchedItems
          .filter((relatedItem) => {
            // 現在の作品を除外
            if (relatedItem.content_id === item.content_id) {
              return false;
            }
            // 無料動画がある作品のみ
            return relatedItem.sampleMovieURL && (
              relatedItem.sampleMovieURL.size_720_480 ||
              relatedItem.sampleMovieURL.size_644_414 ||
              relatedItem.sampleMovieURL.size_560_360 ||
              relatedItem.sampleMovieURL.size_476_306
            );
          })
          .slice(0, 60); // 最大60件まで

        setFetchedRelatedItems(filteredItems);
      }
    } catch (error) {
      console.error('Failed to fetch related items:', error);
      setFetchedRelatedItems([]);
    } finally {
      setIsLoadingRelatedItems(false);
    }
  };

  // 動画を切り替える関数
  const switchToVideo = (index: number) => {
    if (index >= 0 && index < allItems.length) {
      const newItem = allItems[index];
      setCurrentIndex(index);
      setCurrentItem(newItem);
      setVideoUrl(getVideoUrl(newItem));
    }
  };

  // 次の動画へ
  const goToNext = () => {
    if (currentIndex < allItems.length - 1) {
      switchToVideo(currentIndex + 1);
    }
  };

  // 前の動画へ
  const goToPrevious = () => {
    if (currentIndex > 0) {
      switchToVideo(currentIndex - 1);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    let timer: NodeJS.Timeout | null = null;

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setCurrentItem(item);
      setCurrentIndex(0);
      setVideoUrl(getVideoUrl());

      // relatedItemsが空で、かつRelatedVideosSectionが取得中でない場合のみ、CSRで関連動画を取得
      // RelatedVideosSectionが取得中の場合、重複してAPIを叩かないようにする
      if (relatedItems.length === 0 && !isRelatedVideosLoading) {
        // 動画表示後に関連動画を取得（少し遅延させてAPI負荷を軽減）
        timer = setTimeout(() => {
          fetchRelatedItems();
        }, 500); // 0.5秒後に取得
      }
    } else {
      // モーダルが閉じられた時に取得した関連動画をリセット
      setFetchedRelatedItems([]);
      setIsLoadingRelatedItems(false);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, onClose, relatedItems.length, isRelatedVideosLoading]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', height: '100vh', width: '100vw' }}
    >
      <div
        className="relative w-full h-full max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* カウンター */}
            <div className="text-white text-sm">
              {currentIndex + 1} / {allItems.length}
            </div>
          </div>
        </div>

        {/* ビデオプレイヤー */}
        <div className="absolute inset-0 flex items-center justify-center p-1 sm:p-4">
          {videoUrl ? (
            <div className="w-full max-w-4xl aspect-video max-h-[95vh] sm:max-h-[80vh] h-[90vh] sm:h-auto">
              <iframe
                src={videoUrl}
                className="w-full h-full border-0 rounded-lg"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                loading="lazy"
                title={`${currentItem.title} - 無料動画`}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">無料動画は利用できません</p>
            </div>
          )}
        </div>

        {/* ナビゲーションボタン */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-10 px-4">
          {/* 前の動画ボタン */}
          {currentIndex > 0 && (
            <button
              onClick={goToPrevious}
              className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors"
              aria-label="前の動画"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}

          {/* 次の動画ボタン */}
          {currentIndex < allItems.length - 1 && (
            <button
              onClick={goToNext}
              className="pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors ml-auto"
              aria-label="次の動画"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 関連動画リスト（下部） */}
        {allItems.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
            <div className="max-w-6xl mx-auto">
              {/* 現在の動画情報 */}
              <div className="mb-4">
                <Link
                  href={`/item/${currentItem.content_id}`}
                  onClick={() => {
                    // リンククリック時にモーダルを閉じる
                    onClose();
                  }}
                  className="block"
                >
                  <h3 className="text-white text-lg font-bold mb-2 line-clamp-2 hover:text-red-400 transition-colors cursor-pointer">
                    {currentItem.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  {currentItem.date && (
                    <span>{new Date(currentItem.date).toLocaleDateString('ja-JP')}</span>
                  )}
                  {currentItem.review?.count && currentItem.review.count > 0 && (
                    <div className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span>{currentItem.review.average}</span>
                    </div>
                  )}
                </div>
              </div>

                     {/* 関連動画のサムネイルリスト */}
                     <div className="flex gap-2 overflow-x-auto pb-2">
                       {allItems.map((relatedItem, index) => (
                         <button
                           key={relatedItem.content_id}
                           onClick={() => switchToVideo(index)}
                           className={`flex-shrink-0 relative w-16 h-24 rounded overflow-hidden border-2 transition-colors ${
                             index === currentIndex
                               ? 'border-red-500'
                               : 'border-white/30 hover:border-white/60'
                           }`}
                         >
                           <Image
                             src={relatedItem.imageURL?.small || relatedItem.imageURL?.list || ''}
                             alt={relatedItem.title}
                             fill
                             className="object-cover"
                             sizes="64px"
                           />
                           {index === currentIndex && (
                             <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                               <svg
                                 xmlns="http://www.w3.org/2000/svg"
                                 className="h-4 w-4 text-white"
                                 fill="currentColor"
                                 viewBox="0 0 24 24"
                               >
                                 <path d="M8 5v14l11-7z" />
                               </svg>
                             </div>
                           )}
                         </button>
                       ))}
                     </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

