import { fetchItemsFromDuga } from '@/lib/duga-client';
import Header from '@/components/Header';
import ItemCard from '@/components/ItemCard';
import Link from '@/components/ui/Link';
import { Metadata } from 'next';

export const revalidate = 172800;

export const metadata: Metadata = {
  title: 'DUGA 人気作品',
  description: 'FANZA と DUGA を横断する試験サイトの DUGA カタログ。',
  robots: { index: false, follow: false },
};

export default async function DugaRankingPage() {
  let items: Awaited<ReturnType<typeof fetchItemsFromDuga>>['items'] = [];
  let totalCount = 0;

  try {
    const result = await fetchItemsFromDuga({ sort: 'rank', hits: 40, page: 1 }, 172800);
    items = result.items;
    totalCount = result.total_count;
  } catch (error) {
    console.error('DUGA ranking page fetch failed:', error);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-xs uppercase tracking-wide text-amber-400 mb-2">試験カタログ</p>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">DUGA 人気作品</h1>
          <p className="text-gray-400 mb-8">
            素人・PPV 作品を DUGA アフィリエイト経由で表示しています。
            {totalCount > 0 && ` 全${totalCount.toLocaleString()}件`}
          </p>

          {items.length === 0 ? (
            <p className="text-gray-500">DUGA 作品を取得できませんでした。</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((item, index) => (
                <ItemCard
                  key={item.content_id}
                  item={item}
                  priority={index < 4}
                  position={index}
                />
              ))}
            </div>
          )}

          <p className="mt-10 text-sm text-gray-500">
            FANZA 側のランキングは <Link href="/" className="text-blue-400 hover:underline">トップ</Link> を参照。
          </p>
        </div>
      </main>
    </>
  );
}
