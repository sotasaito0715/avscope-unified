'use client';

import { useEffect, useRef, useState } from 'react';
import { DMMItem } from '@/types/dmm';
import ItemCard from './ItemCard';
import { LoadingSpinner } from './ui/Loading';

// ============================================
// 型定義
// ============================================

interface RelatedVideosSectionProps {
  currentItem: DMMItem;
  maxCount?: number;
  onItemsFetched?: (items: DMMItem[]) => void; // 取得したデータを親に渡すコールバック
  onLoadingStateChange?: (isLoading: boolean) => void; // 取得中の状態を親に渡すコールバック
  showTitle?: boolean; // タイトルを表示するかどうか
}

// ============================================
// コンポーネント
// ============================================

/**
 * 「他の人はこの動画も見ています」セクション
 * ページレンダリング完了から2秒後にCSRで関連動画を取得
 * API URLごとにキャッシュを管理（同じAPI URLはどのページでも再利用）
 */
export default function RelatedVideosSection({
  currentItem,
  maxCount = 8,
  onItemsFetched,
  onLoadingStateChange,
  showTitle = true,
}: RelatedVideosSectionProps) {
  const [items, setItems] = useState<DMMItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const onItemsFetchedRef = useRef(onItemsFetched);
  const onLoadingStateChangeRef = useRef(onLoadingStateChange);

  useEffect(() => {
    onItemsFetchedRef.current = onItemsFetched;
    onLoadingStateChangeRef.current = onLoadingStateChange;
  }, [onItemsFetched, onLoadingStateChange]);

  // API URLからキャッシュキーを生成
  const getCacheKey = (apiUrl: string): string => {
    try {
      // URLを正規化（パスのみ、クエリパラメータをソート）
      const url = new URL(apiUrl, window.location.origin);
      const params = new URLSearchParams(url.search);
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      
      // キャッシュキー: api_path_param1=value1&param2=value2
      return `api_${url.pathname}_${sortedParams}`;
    } catch {
      // URL解析に失敗した場合は元のURLを使用
      return `api_${apiUrl.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
  };

  // キャッシュから取得
  const getCachedItems = (cacheKey: string): DMMItem[] | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed as DMMItem[];
      }
    } catch (error) {
      console.error('Failed to read cache:', error);
    }
    return null;
  };

  // キャッシュに保存
  const setCachedItems = (cacheKey: string, items: DMMItem[]) => {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  };

  useEffect(() => {
    // 取得開始を親に通知
    onLoadingStateChangeRef.current?.(true);

    // 女優からランダムに1つ選ぶ
    const actresses = currentItem.iteminfo?.actress || [];
    let selectedArticleType: 'actress' | 'genre' | null = null;
    let selectedArticleId: string | null = null;

    if (actresses.length > 0) {
      // ランダムに女優を1つ選ぶ
      const randomActress = actresses[Math.floor(Math.random() * actresses.length)];
      selectedArticleType = 'actress';
      selectedArticleId = randomActress.id.toString();
    } else {
      // 女優がいない場合はジャンルからランダムに1つ選ぶ
      const genres = currentItem.iteminfo?.genre || [];
      if (genres.length > 0) {
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        selectedArticleType = 'genre';
        selectedArticleId = randomGenre.id.toString();
      }
    }

    // 取得対象がない場合は終了
    if (!selectedArticleType || !selectedArticleId) {
      setItems([]);
      setIsLoading(false);
      setHasFetched(true);
      onLoadingStateChangeRef.current?.(false);
      return;
    }

    // API URLを構築
    const apiUrl = `/api/items?article=${selectedArticleType}&article_id=${selectedArticleId}&hits=60&sort=rank`;
    const cacheKey = getCacheKey(apiUrl);

    // キャッシュから取得を試みる
    const cachedItems = getCachedItems(cacheKey);
    if (cachedItems && cachedItems.length > 0) {
      // キャッシュから取得したアイテムをフィルタリング（現在の作品を除外、無料動画があるもののみ）
      const filteredItems = cachedItems
        .filter((relatedItem) => {
          // 現在の作品を除外
          if (relatedItem.content_id === currentItem.content_id) {
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
        .slice(0, maxCount);

      if (filteredItems.length > 0) {
        setItems(filteredItems);
        // 親に取得したデータを渡す
        onItemsFetchedRef.current?.(filteredItems);
        setIsLoading(false);
        setHasFetched(true);
        onLoadingStateChangeRef.current?.(false);
        return;
      }
    }

    // ページレンダリング完了から2秒後にAPIコールを実行
    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        // 取得開始を親に通知
        onLoadingStateChangeRef.current?.(true);

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`Failed to fetch related items: ${response.status}`);
        }

        const data = await response.json();
        const fetchedItems: DMMItem[] = data.items || [];

        // 現在の作品を除外し、無料動画がある作品のみに絞る
        const filteredItems = fetchedItems
          .filter((relatedItem) => {
            // 現在の作品を除外
            if (relatedItem.content_id === currentItem.content_id) {
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
          .slice(0, maxCount); // 最大件数まで

        setItems(filteredItems);
        // 親に取得したデータを渡す
        onItemsFetchedRef.current?.(filteredItems);
        // 元のAPIレスポンス（フィルタリング前）をキャッシュに保存
        // これにより、他のページでも同じAPIレスポンスを再利用できる
        setCachedItems(cacheKey, fetchedItems);
        setHasFetched(true);
        onLoadingStateChangeRef.current?.(false);
      } catch (error) {
        console.error('Failed to fetch related videos:', error);
        setItems([]);
        setHasFetched(true);
        onLoadingStateChangeRef.current?.(false);
      } finally {
        setIsLoading(false);
      }
    }, 2000); // 2秒後に実行

    // クリーンアップ
    return () => {
      clearTimeout(timer);
    };
  }, [currentItem, maxCount]);

  // ローディング表示
  if (isLoading && !hasFetched) {
    return (
      <div className="mt-12">
        {showTitle && (
          <h2 className="text-2xl font-bold text-gray-100 mb-6">関連動画</h2>
        )}
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" message="関連動画を読み込み中..." />
        </div>
      </div>
    );
  }

  // 動画が見つからない場合は何も表示しない
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      {showTitle && (
        <h2 className="text-2xl font-bold text-gray-100 mb-6">関連動画</h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item, index) => (
          <ItemCard
            key={item.content_id}
            item={item}
            priority={index < 8}
            pageType="item"
            relatedItems={items.filter(i => i.content_id !== item.content_id)}
          />
        ))}
      </div>
    </div>
  );
}

