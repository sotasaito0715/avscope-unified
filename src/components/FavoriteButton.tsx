/**
 * お気に入りボタンコンポーネント
 *
 * @description
 * 作品や女優をお気に入りに追加/削除するためのボタンコンポーネント。
 * ハートアイコンでお気に入り状態を表示し、クリックでトグル機能を提供。
 *
 * @author AV Scope Team
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { DMMItem, ActressInfo } from '@/types/dmm';
import { useFavorites } from '@/hooks/useFavorites';

interface FavoriteButtonProps {
  item: DMMItem | ActressInfo;
  type: 'item' | 'actress';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({ 
  item, 
  type, 
  size = 'md', 
  className = ''
}: FavoriteButtonProps) {
  const { isFavorite, toggleItem, isHydrated } = useFavorites();
  const [isAnimating, setIsAnimating] = useState(false);

  const itemId = type === 'item'
    ? (item as DMMItem).content_id
    : (item as ActressInfo).id.toString();

  const isFav = isFavorite(itemId);

  const handleClick = () => {
    if (!isHydrated) return;

    // カテゴリが1つしかない場合は直接トグル
    setIsAnimating(true);
    toggleItem(item, type);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <button
      onClick={handleClick}
      className={`relative rounded-full flex items-center justify-center gap-2 transition-colors duration-200
        ${isFav ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-200'}
        ${sizeClasses[size]}
        ${className}
      `}
      aria-label={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
      disabled={!isHydrated}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizeClasses[size]} ${isAnimating ? 'animate-ping-once' : ''}`}
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M12 5.47l-.707-.707C9.81 3.586 7.32 2 4.5 2 1.903 2 0 3.903 0 6.5c0 2.412 1.723 4.43 4.15 6.01L12 22l7.85-9.49C22.277 10.93 24 8.912 24 6.5 24 3.903 22.097 2 19.5 2c-2.82 0-5.31 1.586-6.793 2.763L12 5.47z"
          clipRule="evenodd"
        />
      </svg>
      <span className="font-semibold leading-none">
        お気に入り
      </span>
    </button>
  );
}
