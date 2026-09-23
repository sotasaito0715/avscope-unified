import { getRecommendedItems } from '@/lib/dmm';
import ItemCard from './ItemCard';

interface RecommendedItemsSectionProps {
  excludeContentId?: string;
  count?: number;
}

/**
 * おすすめ作品セクション（サーバーコンポーネント）
 * キャッシュされた作品からランダムに選択して表示
 * DMM APIにはアクセスしない
 */
export default async function RecommendedItemsSection({
  excludeContentId,
  count = 8,
}: RecommendedItemsSectionProps) {
  // キャッシュからおすすめ作品を取得（DMM APIにはアクセスしない）
  const recommendedItems = await getRecommendedItems(excludeContentId, count);

  if (recommendedItems.length === 0) {
    return null;
  }

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">おすすめ作品</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {recommendedItems.map((item) => (
          <ItemCard
            key={item.content_id}
            item={item}
            priority={false}
            pageType="item"
          />
        ))}
      </div>
    </div>
  );
}

