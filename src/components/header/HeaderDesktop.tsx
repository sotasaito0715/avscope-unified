/**
 * デスクトップヘッダーコンポーネント
 * 
 * @description
 * デスクトップ表示用のヘッダーコンポーネント
 */

'use client';

import Link from '@/components/ui/Link';
import Navigation from './Navigation';
import SearchForm from './SearchForm';
import { useFavorites } from '@/hooks/useFavorites';

interface HeaderDesktopProps {
  onFavoritesOpen: () => void;
}

export default function HeaderDesktop({ onFavoritesOpen }: HeaderDesktopProps) {
  const { items, isHydrated } = useFavorites();
  const totalFavorites = items.length;

  return (
    <div className="hidden xl:flex items-start justify-between gap-4 min-h-16 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-x-4">
        <Link href="/" className="flex items-center shrink-0">
          <p className="text-xl font-bold text-gray-100" aria-label="AV Scope Mix">
            <span className="bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">AV Scope Mix</span>
            <span className="ml-2 align-middle text-[10px] font-semibold tracking-wide text-amber-400">試験</span>
          </p>
        </Link>
        
        <Navigation variant="desktop" />
        
        <button
          onClick={onFavoritesOpen}
          className="relative text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap shrink-0"
        >
          ❤️ お気に入り
          {isHydrated && totalFavorites > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
              {totalFavorites}
            </span>
          )}
        </button>
      </div>
      
      <SearchForm variant="desktop" />
    </div>
  );
}

