/**
 * お気に入りモーダルコンポーネント
 *
 * @description
 * お気に入りに追加された作品と女優を表示するモーダルコンポーネント。
 * タブで作品と女優を切り替え、カテゴリ別にフィルタリング可能。
 *
 * @author AV Scope Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { useFavorites } from '@/hooks/useFavorites';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { getOptimizedImageUrl } from '@/lib/image-utils';
import { formatDMMPrice } from '@/lib/price-utils';
import { DMMItem, ActressInfo } from '@/types/dmm';
import { getItemHref } from '@/lib/catalog';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
  const {
    items: favorites,
    categories,
    removeItem,
    getFavoritesByType,
    getFavoritesByCategory,
    clearAll
  } = useFavorites();

  const { items: searchHistory, removeSearch, clearHistory } = useSearchHistory();

  const [activeTab, setActiveTab] = useState<'items' | 'actresses' | 'history'>('items');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isShareOpen, setIsShareOpen] = useState(false);

  // 共有URLを生成
  useEffect(() => {
    if (typeof window !== 'undefined' && favorites.length > 0) {
      const favoriteIds = favorites.map(fav => fav.id).join(',');
      const url = new URL('/favorites', window.location.origin);
      url.searchParams.set('ids', favoriteIds);
      setShareUrl(url.toString());
    }
  }, [favorites]);

  // 共有機能
  const handleShare = async () => {
    if (!shareUrl) return;

    try {
      // Web Share APIをサポートしている場合
      if (navigator.share) {
        await navigator.share({
          title: 'AV Scope - お気に入りリスト',
          text: `${favorites.length}件のお気に入り作品・女優を共有します`,
          url: shareUrl,
        });
      } else {
        // フォールバック: クリップボードにコピー
        await navigator.clipboard.writeText(shareUrl);
        alert('共有URLをクリップボードにコピーしました！');
      }
      setIsShareOpen(false);
    } catch (error) {
      // ユーザーが共有をキャンセルした場合など
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        // フォールバック: クリップボードにコピー
        try {
          await navigator.clipboard.writeText(shareUrl);
          alert('共有URLをクリップボードにコピーしました！');
        } catch (clipboardError) {
          console.error('Error copying to clipboard:', clipboardError);
        }
      }
    }
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('URLをクリップボードにコピーしました！');
      setIsShareOpen(false);
    } catch (error) {
      console.error('Error copying URL:', error);
    }
  };

  if (!isOpen) return null;

  const favoriteItems = getFavoritesByType('item');
  const favoriteActresses = getFavoritesByType('actress');

  const filteredItems = selectedCategory === 'all'
    ? favoriteItems
    : getFavoritesByCategory(selectedCategory).filter(fav => fav.type === 'item');

  const filteredActresses = selectedCategory === 'all'
    ? favoriteActresses
    : getFavoritesByCategory(selectedCategory).filter(fav => fav.type === 'actress');

  const renderRemoveButton = (id: string) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        removeItem(id);
      }}
      className="text-gray-400 hover:text-red-500 transition-colors"
      aria-label="お気に入りから削除"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#333]">
          <h2 className="text-2xl font-bold text-white">お気に入り & 履歴</h2>
          <div className="flex items-center gap-2">
            {favorites.length > 0 && (
              <button
                onClick={() => setIsShareOpen(!isShareOpen)}
                className="text-gray-400 hover:text-white transition-colors p-2"
                aria-label="共有"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 共有メニュー */}
        {isShareOpen && favorites.length > 0 && (
          <div className="p-4 bg-[#252525] border-b border-[#333]">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-300">
                お気に入りリスト（{favorites.length}件）を共有
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                >
                  📤 共有
                </button>
                <button
                  onClick={handleCopyUrl}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                >
                  📋 URLをコピー
                </button>
              </div>
              {/* SNSシェアボタン */}
              <div className="flex gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`AV Scope - ${favorites.length}件のお気に入り作品・女優を共有します`)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-[#1DA1F2] text-white rounded-md hover:bg-[#1a91da] transition-colors text-sm text-center"
                >
                  🐦 Twitter
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-[#1877F2] text-white rounded-md hover:bg-[#166fe5] transition-colors text-sm text-center"
                >
                  📘 Facebook
                </a>
                <a
                  href={`https://line.me/R/msg/text/?${encodeURIComponent(`AV Scope - ${favorites.length}件のお気に入り作品・女優を共有します ${shareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-3 py-2 bg-[#00C300] text-white rounded-md hover:bg-[#00b000] transition-colors text-sm text-center"
                >
                  💬 LINE
                </a>
              </div>
              {shareUrl && (
                <div className="text-xs text-gray-400 break-all bg-[#1a1a1a] p-2 rounded">
                  {shareUrl}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex border-b border-[#333]">
          <button
            className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'items' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('items')}
          >
            作品 ({favoriteItems.length})
          </button>
          <button
            className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'actresses' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('actresses')}
          >
            女優 ({favoriteActresses.length})
          </button>
          <button
            className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'history' ? 'text-red-400 border-b-2 border-red-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('history')}
          >
            検索履歴 ({searchHistory.length})
          </button>
        </div>

        <div className="flex-grow overflow-y-auto p-4">
          {activeTab !== 'history' && (
            <div className="mb-4 flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1 rounded-full text-xs ${selectedCategory === category.id ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'items' && (
            filteredItems.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                <p>お気に入りの作品がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(favorite => {
                  const item = favorite.data as DMMItem;
                  return (
                    <div key={favorite.id} className="bg-[#252525] rounded-lg p-4 hover:bg-[#333] transition-colors">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-20 flex-shrink-0">
                          <Image
                            src={getOptimizedImageUrl(item.imageURL, 'small')}
                            alt={item.title}
                            fill
                            sizes="64px"
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow">
                          <Link href={getItemHref(item)} className="text-sm font-bold text-white hover:text-red-400 line-clamp-2">
                            {item.title}
                          </Link>
                          <p className="text-xs text-gray-400 mt-1">
                            {item.iteminfo?.actress?.[0]?.name || '女優情報なし'}
                          </p>
                          <p className="text-xs text-red-400 mt-1">
                            {formatDMMPrice(item.prices?.price)}
                          </p>
                        </div>
                        {renderRemoveButton(favorite.id)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'actresses' && (
            filteredActresses.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p>お気に入りの女優がありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActresses.map(favorite => {
                  const actress = favorite.data as ActressInfo;
                  return (
                    <div key={favorite.id} className="bg-[#252525] rounded-lg p-4 hover:bg-[#333] transition-colors">
                      <div className="flex gap-3">
                        <div className="relative w-16 h-20 flex-shrink-0">
                          <Image
                            src={getOptimizedImageUrl(actress.imageURL, 'small')}
                            alt={actress.name}
                            fill
                            sizes="64px"
                            className="object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow">
                          <Link href={`/actress/${actress.id}`} className="text-sm font-bold text-white hover:text-red-400 line-clamp-2">
                            {actress.name}
                          </Link>
                          <p className="text-xs text-gray-400 mt-1">
                            {actress.ruby}
                          </p>
                        </div>
                        {renderRemoveButton(favorite.id)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {activeTab === 'history' && (
            searchHistory.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>検索履歴がありません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {searchHistory.map(entry => (
                  <Link
                    key={entry.id}
                    href={`/search?q=${encodeURIComponent(entry.query)}`}
                    className="flex justify-between items-center bg-[#252525] p-3 rounded-lg hover:bg-[#333] transition-colors group"
                  >
                    <div className="flex-grow">
                      <p className="text-sm text-white group-hover:text-red-400">{entry.query}</p>
                      <p className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleString('ja-JP')}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.preventDefault(); // Linkへの遷移を防ぐ
                        removeSearch(entry.id);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                      aria-label="履歴から削除"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </Link>
                ))}
              </div>
            )
          )}
        </div>

        <div className="p-4 border-t border-[#333] flex justify-between">
          <button 
            onClick={() => {
              if (activeTab === 'history') {
                clearHistory();
              } else {
                clearAll();
              }
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            {activeTab === 'history' ? '履歴をクリア' : 'すべてクリア'}
          </button>
          <button onClick={onClose} className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
