'use client';

import { useEffect, useState } from 'react';
import { DMMItem } from '@/types/dmm';
import { getSimilarItems, getPopularItems } from '@/lib/recommendations';
import ItemCard from './ItemCard';
import { LoadingSkeleton } from './ui/Loading';

interface RecommendationsProps {
  currentItem: DMMItem;
  allItems: DMMItem[];
  type?: 'similar' | 'popular';
}

export default function Recommendations({ 
  currentItem, 
  allItems,
  type = 'similar'
}: RecommendationsProps) {
  const [recommendedItems, setRecommendedItems] = useState<DMMItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      try {
        let items: DMMItem[] = [];
        
        if (type === 'similar') {
          // 類似作品を取得
          items = getSimilarItems(currentItem, allItems, 8);
        } else {
          // 人気作品を取得
          items = getPopularItems(allItems, 8);
        }

        setRecommendedItems(items);
      } catch (error) {
        console.error('Failed to get recommendations:', error);
        setRecommendedItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [currentItem, allItems, type]);

  if (isLoading) {
    return (
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">
          {type === 'similar' ? 'この作品を閲覧した人はこちらも見ています' : '人気作品'}
        </h2>
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  if (recommendedItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">
        {type === 'similar' ? 'この作品を閲覧した人はこちらも見ています' : '人気作品'}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendedItems.map((item) => (
          <ItemCard
            key={item.content_id}
            item={item}
            priority={false}
          />
        ))}
      </div>
    </div>
  );
}

