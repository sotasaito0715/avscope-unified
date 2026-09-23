import { fetchItems } from '@/lib/dmm';
import Header from '@/components/Header';
import ItemsListClient from '@/components/ItemsListClient';
import DugaRankingSection from '@/components/DugaRankingSection';
import FAQ from '@/components/FAQ';
import RandomAd from '@/components/RandomAd';
import { ITEMS_PER_PAGE } from '@/lib/constants';
import { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';

// ISR設定（1週間キャッシュ）- searchParamsを削除したのでISRが有効に
export const revalidate = 604800;

// 静的メタデータ
export const metadata: Metadata = {
  title: '人気AVランキング',
  description: 'FANZA と DUGA の人気作品を横断して探す試験カタログ。',
  robots: { index: false, follow: false },
};

export default async function Home() {
  const itemsPerPage = ITEMS_PER_PAGE;
  
  // サーバーサイド: 1ページ目のデータを取得（ISRキャッシュ有効）
  const { items, total_count } = await fetchItems({ 
    sort: 'rank', 
    hits: itemsPerPage,
    page: 1
  });

  // JSON-LD for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "人気AVランキング",
    "description": "AV Scopeの人気AVランキング。話題の作品をランキング形式で紹介",
    "numberOfItems": total_count,
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": item.title,
        "description": item.title,
        "image": item.imageURL?.large,
        "url": item.affiliateURL,
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
      <main className="min-h-screen bg-[#0a0a0a]">
        {/* モバイル用横長バナー（上部） */}
        <div className="lg:hidden w-full px-4 pt-4 pb-0 bg-[#0a0a0a]">
          <div className="max-w-7xl mx-auto">
            <RandomAd 
              placement="banner"
              className="flex justify-center"
            />
          </div>
        </div>

        {/* クライアントサイドページネーション */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 lg:pt-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <ItemsListClient
                initialData={{ items, total_count }}
                initialSort="rank"
                basePath="/"
                title="人気AVランキング（FANZA）"
              />

              <DugaRankingSection />
              
              {/* モバイル用横長バナー（コンテンツ中間） */}
              <div className="lg:hidden w-full py-6">
                <RandomAd 
                  placement="banner"
                  className="flex justify-center"
                />
              </div>
              
              {/* FAQ */}
              <FAQ />
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
