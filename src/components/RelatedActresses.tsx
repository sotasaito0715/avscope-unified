'use client';

import { useEffect, useState } from 'react';
import { ActressInfo, DMMItem } from '@/types/dmm';
import ActressCard from './ActressCard';
import { LoadingSpinner } from './ui/Loading';

// ============================================
// 型定義
// ============================================

interface RelatedActressesProps {
  currentItem: DMMItem;
  maxCount?: number;
}

// ============================================
// コンポーネント
// ============================================

/**
 * 関連女優表示コンポーネント
 */
export default function RelatedActresses({
  currentItem,
  maxCount = 6,
}: RelatedActressesProps) {
  const [actresses, setActresses] = useState<ActressInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRelatedActresses = async () => {
      try {
        setIsLoading(true);

        // 現在の作品の女優を取得
        const currentActresses = currentItem.iteminfo?.actress || [];
        
        if (currentActresses.length === 0) {
          setActresses([]);
          return;
        }

        // 全ての女優IDを一度に取得（カンマ区切りで複数IDを送信）
        const actressIds = currentActresses.slice(0, maxCount).map(a => a.id.toString()).join(',');
        
        // 複数の女優IDをカンマ区切りで一度にリクエスト
        // エラー時は空配列を返す（API負荷を優先、フォールバック処理は削除）
        const response = await fetch(`/api/actress?actress_id=${actressIds}`);
        if (!response.ok) {
          console.error(`Failed to fetch actresses: ${response.status}`);
          setActresses([]);
          return;
        }
        
        const data = await response.json();
        // レスポンスは配列形式または単一オブジェクト形式に対応
        const actressArray: unknown[] = Array.isArray(data.result?.actress) 
          ? data.result.actress 
          : data.actress 
            ? Array.isArray(data.actress) ? data.actress : [data.actress]
            : [];
        
        const validActresses = actressArray.slice(0, maxCount).filter((a): a is ActressInfo => a !== null && typeof a === 'object' && 'id' in a);
        setActresses(validActresses);
      } catch (error) {
        console.error('Failed to fetch related actresses:', error);
        setActresses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRelatedActresses();
  }, [currentItem, maxCount]);

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">出演女優</h2>
        <LoadingSpinner size="sm" message="女優情報を読み込み中..." />
      </div>
    );
  }

  if (actresses.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">
        出演女優 ({actresses.length}名)
      </h2>
      <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="flex gap-4 w-max">
            {actresses.map((actress) => (
              <div key={actress.id} className="w-40 flex-shrink-0">
                <ActressCard actress={actress} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

