'use client';

import { memo } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { ActressInfo } from '@/types/dmm';
import FavoriteButton from './FavoriteButton';

interface ActressCardProps {
  actress: ActressInfo;
}

function ActressCard({ actress }: ActressCardProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:bg-[#252525] transition-all duration-200 relative">
      <Link href={`/actress/${actress.id}`} className="block p-4">
        <div className="flex flex-col items-center">
          {/* 円形の画像 */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden mb-3 bg-[#252525] flex-shrink-0">
            {actress.imageURL?.large ? (
              <Image
                src={actress.imageURL.large}
                alt={actress.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          
          {/* 名前とルビ */}
          <div className="text-center w-full">
            <h3 className="font-semibold text-sm text-gray-100 mb-1 line-clamp-2">
              {actress.name}
            </h3>
            {actress.ruby && (
              <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                {actress.ruby}
              </p>
            )}
            
            {/* サイズ情報 */}
            <div className="flex flex-wrap justify-center gap-1 text-xs text-gray-500">
              {actress.bust && (
                <span>B:{actress.bust}</span>
              )}
              {actress.waist && (
                <span>W:{actress.waist}</span>
              )}
              {actress.hip && (
                <span>H:{actress.hip}</span>
              )}
            </div>
            
            {/* 身長 */}
            {actress.height && (
              <p className="text-xs text-gray-500 mt-1">
                {actress.height}cm
              </p>
            )}
          </div>
        </div>
      </Link>
      {/* お気に入りボタン */}
      <div className="absolute top-2 right-2">
        <FavoriteButton item={actress} type="actress" size="sm" />
      </div>
    </div>
  );
}

// React.memoでラップしてパフォーマンス最適化
export default memo(ActressCard);

