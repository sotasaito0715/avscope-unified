/**
 * ヘッダーコンポーネント
 * 
 * @description
 * アプリケーションのメインヘッダーコンポーネント。
 * デスクトップとモバイルの両方の表示を統合管理する。
 */

'use client';

import { useState } from 'react';
import FavoritesModal from './FavoritesModal';
import HeaderDesktop from './header/HeaderDesktop';
import HeaderMobile from './header/HeaderMobile';

export default function Header() {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  return (
    <header className="bg-[#1a1a1a] shadow-sm border-b border-[#333333] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeaderDesktop onFavoritesOpen={() => setIsFavoritesOpen(true)} />
        <HeaderMobile onFavoritesOpen={() => setIsFavoritesOpen(true)} />
      </div>

      {/* お気に入りモーダル */}
      <FavoritesModal 
        isOpen={isFavoritesOpen} 
        onClose={() => setIsFavoritesOpen(false)} 
      />
    </header>
  );
}
