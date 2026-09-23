/**
 * モバイルヘッダーコンポーネント
 * 
 * @description
 * モバイル表示用のヘッダーコンポーネント
 */

'use client';

import { useState } from 'react';
import Link from '@/components/ui/Link';
import MobileMenu from './MobileMenu';
import SearchForm from './SearchForm';

interface HeaderMobileProps {
  onFavoritesOpen: () => void;
}

export default function HeaderMobile({ onFavoritesOpen }: HeaderMobileProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="xl:hidden">
      {/* ヘッダー行 */}
      <div className="flex justify-between items-center h-14">
        <Link href="/" className="flex items-center" onClick={handleMobileMenuClose}>
          <p className="text-lg font-bold text-gray-100" aria-label="AV Scope Mix">
            <span className="bg-gradient-to-r from-pink-500 to-red-500 bg-clip-text text-transparent">AV Scope Mix</span>
            <span className="ml-1.5 align-middle text-[10px] font-semibold tracking-wide text-amber-400">試験</span>
          </p>
        </Link>
        
        {/* ハンバーガーメニューボタン */}
        <button
          onClick={handleMobileMenuToggle}
          className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-[#252525] transition-colors"
          aria-label="メニューを開く"
        >
          {isMobileMenuOpen ? (
            // 閉じるアイコン（×）
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            // ハンバーガーアイコン（≡）
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* ハンバーガーメニュー */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
        onFavoritesOpen={onFavoritesOpen}
      />

      {/* 検索フォーム行 */}
      <div className="pb-3">
        <SearchForm variant="mobile" onSearch={handleMobileMenuClose} />
      </div>
    </div>
  );
}

