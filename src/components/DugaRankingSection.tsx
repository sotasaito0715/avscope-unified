import { fetchItemsFromDuga } from '@/lib/duga-client';
import ItemCard from '@/components/ItemCard';
import Link from '@/components/ui/Link';

export default async function DugaRankingSection() {
  let items: Awaited<ReturnType<typeof fetchItemsFromDuga>>['items'] = [];

  try {
    const result = await fetchItemsFromDuga({ sort: 'rank', hits: 12, page: 1 }, 172800);
    items = result.items;
  } catch (error) {
    console.error('DUGA ranking fetch failed:', error);
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-400 mb-1">DUGA / 素人</p>
          <h2 className="text-2xl font-bold text-gray-100">DUGA 人気作品</h2>
        </div>
        <Link href="/duga" className="text-sm text-blue-400 hover:text-blue-300">
          もっと見る →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item, index) => (
          <ItemCard key={`duga-${item.content_id}`} item={item} priority={index < 4} position={index} />
        ))}
      </div>
    </section>
  );
}
