/**
 * モバイルメニューコンポーネント
 * 
 * @description
 * モバイル表示用のハンバーガーメニューコンポーネント
 */

'use client';

import { useEffect, useRef } from 'react';
import Navigation from './Navigation';
import { useFavorites } from '@/hooks/useFavorites';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFavoritesOpen: () => void;
}

export default function MobileMenu({ isOpen, onClose, onFavoritesOpen }: MobileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { items, isHydrated } = useFavorites();
  const totalFavorites = items.length;

  // メニュー外をクリックしたら閉じる、ESCキーで閉じる
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('button[aria-label="メニューを開く"]')
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        style={{ top: '56px' }}
        onClick={onClose}
      />
      {/* メニューコンテンツ */}
      <div 
        ref={menuRef}
        className="absolute top-14 left-0 right-0 bg-[#1a1a1a] border-b border-[#333333] shadow-lg z-50 animate-in slide-in-from-top-2 duration-200"
      >
        <Navigation variant="mobile" onLinkClick={onClose} />
        <button
          onClick={() => {
            onFavoritesOpen();
            onClose();
          }}
          className="w-full flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-[#252525] transition-colors text-left"
        >
          <span className="mr-3 text-lg">❤️</span>
          <span className="font-medium">お気に入り</span>
          {isHydrated && totalFavorites > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-[20px] flex items-center justify-center">
              {totalFavorites}
            </span>
          )}
        </button>
      </div>
    </>
  );
}

