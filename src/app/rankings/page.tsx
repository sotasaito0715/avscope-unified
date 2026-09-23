import { fetchItems } from '@/lib/dmm';
import Header from '@/components/Header';
import RankingsClient from '@/components/RankingsClient';
import Breadcrumbs from '@/components/Breadcrumbs';
import RandomAd from '@/components/RandomAd';
import { Metadata } from 'next';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import JsonLd from '@/components/JsonLd';

// ISR設定（1週間キャッシュ）- searchParamsを削除したのでISRが有効に
export const revalidate = 604800;

// 静的メタデータ
export const metadata: Metadata = {
  title: 'ランキング一覧',
  description: '人気ランキング、新着ランキング、価格別ランキング、評価ランキングなど様々なランキングをチェック',
  alternates: {
    canonical: 'https://www.avscope.jp/rankings',
  },
  openGraph: {
    title: 'ランキング一覧',
    description: '人気ランキング、新着ランキング、価格別ランキング、評価ランキングなど様々なランキングをチェック',
    url: 'https://www.avscope.jp/rankings',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'ランキング一覧' }],
  },
};

export default async function RankingsPage() {
  const itemsPerPage = ITEMS_PER_PAGE;

  // サーバーサイド: 1ページ目の人気ランキングを取得（ISRキャッシュ有効）
  const { items, total_count } = await fetchItems({ 
    sort: 'rank', 
    hits: itemsPerPage,
    page: 1
  });

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "人気ランキング",
    "description": "DMMで人気の作品をランキング形式で表示",
    "numberOfItems": total_count,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": item.title,
        "description": item.title,
        "image": item.imageURL?.large,
        "url": `https://video.dmm.co.jp/av/content/?id=${item.content_id}`,
        "offers": {
          "@type": "Offer",
          "price": item.prices?.price,
          "priceCurrency": "JPY"
        }
      }
    }))
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* モバイル用横長バナー（上部） */}
      <div className="lg:hidden w-full px-4 py-4 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto">
          <RandomAd 
            placement="banner"
            className="flex justify-center"
          />
        </div>
      </div>

      <main className="min-h-screen bg-[#0a0a0a]">
        <Breadcrumbs
          items={[
            { label: 'ランキング', href: '/rankings' },
          ]}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <RankingsClient
                initialData={{ items, total_count }}
                initialType="popular"
              />

              {/* モバイル用横長バナー（コンテンツ中間） */}
              <div className="lg:hidden w-full py-6">
                <RandomAd 
                  placement="banner"
                  className="flex justify-center"
                />
              </div>
            </div>
            
            {/* サイドバー: 広告（PCのみ） */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-8 space-y-6">
                <RandomAd 
                  placement="sidebar"
                  className="flex justify-center"
                />
                <RandomAd 
                  placement="sidebar"
                  className="flex justify-center"
                />
              </div>
            </aside>
          </div>
        </div>

        {/* モバイル用横長バナー（下部） */}
        <div className="lg:hidden w-full px-4 py-4 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
            <RandomAd 
              placement="banner"
              className="flex justify-center"
            />
          </div>
        </div>
      </main>
    </>
  );
}
