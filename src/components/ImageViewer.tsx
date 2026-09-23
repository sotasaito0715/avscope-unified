'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageViewerProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export default function ImageViewer({ images, initialIndex, isOpen, onClose, title }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // スワイプと判定する最小距離（ピクセル）
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, goToNext, goToPrevious, onClose]);

  // タッチ開始
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  // タッチ移動
  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);
    setDragOffset(currentTouch - touchStart);
  };

  // タッチ終了
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && images.length > 1) {
      goToNext();
    }
    if (isRightSwipe && images.length > 1) {
      goToPrevious();
    }
    
    // リセット
    setTouchStart(null);
    setTouchEnd(null);
    setIsDragging(false);
    setDragOffset(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-85"
      onClick={onClose}
    >
      <div
        className="relative w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3"
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

        {/* 画像カウンター */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>

        {/* 前へボタン */}
        {images.length > 1 && (
          <button
            onClick={goToPrevious}
            className="absolute left-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 md:p-4"
            aria-label="前の画像"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
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

        {/* メイン画像（スワイプ対応） */}
        <div 
          ref={containerRef}
          className="relative w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            className="relative w-full h-full transition-transform duration-200 ease-out"
            style={{
              transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
              transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
          >
            <Image
              src={images[currentIndex]}
              alt={`${title} サンプル画像 ${currentIndex + 1}`}
              fill
              className="object-contain select-none"
              sizes="100vw"
              priority
              quality={95}
              draggable={false}
            />
          </div>
        </div>

        {/* 次へボタン */}
        {images.length > 1 && (
          <button
            onClick={goToNext}
            className="absolute right-4 z-20 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3 md:p-4"
            aria-label="次の画像"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 md:h-8 md:w-8"
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

        {/* サムネイル一覧（デスクトップのみ） */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
            <div className="flex gap-2 bg-black bg-opacity-70 p-2 rounded-lg max-w-screen-lg overflow-x-auto">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative w-16 h-16 flex-shrink-0 rounded overflow-hidden transition-all ${
                    index === currentIndex
                      ? 'ring-2 ring-blue-500 opacity-100'
                      : 'opacity-50 hover:opacity-75'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`サムネイル ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* モバイル用: スワイプインジケーター */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 md:hidden">
          <div className="flex gap-1">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-6' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

