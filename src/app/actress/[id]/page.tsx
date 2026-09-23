import { fetchItems, fetchActressInfo, convertActressInfo } from '@/lib/dmm';
import Header from '@/components/Header';
import ActressCard from '@/components/ActressCard';
import ActressItemsListClient from '@/components/ActressItemsListClient';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs';
import RandomAd from '@/components/RandomAd';
import { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { buildOgImages, buildTwitterImages } from '@/lib/seo';

// ISR設定（1週間キャッシュ）
export const revalidate = 604800;

// generateStaticParamsを定義することで、動的ルートでもISRが有効になる
export async function generateStaticParams() {
  return [];
}

// 未知のパラメータでもオンデマンドで生成を許可
export const dynamicParams = true;

// 定数
const ITEMS_PER_PAGE = 60;

interface ActressPageProps {
  params: Promise<{
    id: string;
  }>;
}

// メタデータ生成
export async function generateMetadata({ params }: ActressPageProps): Promise<Metadata> {
  const { id: actressId } = await params;
  const canonical = `https://www.avscope.jp/actress/${actressId}`;

  // 女優情報を取得してOG画像を設定
  const actressInfo = await fetchActressInfo(actressId);
  const actressName = actressInfo?.name || '女優';
  const actressImage = actressInfo?.imageURL?.large || actressInfo?.imageURL?.small || '';

  return {
    title: `${actressName}の出演作品一覧`,
    description: `${actressName}が出演するAV作品一覧。人気作品をチェック。`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `${actressName}の出演作品一覧`,
      description: `${actressName}が出演するAV作品一覧。人気作品をチェック。`,
      type: 'website',
      url: canonical,
      siteName: 'AV Scope',
      images: buildOgImages(actressImage, actressName, { width: 800, height: 800 }),
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${actressName}の出演作品一覧`,
      description: `${actressName}が出演するAV作品一覧。`,
      images: buildTwitterImages(actressImage),
    },
  };
}

export default async function ActressPage({ params }: ActressPageProps) {
  const { id: actressId } = await params;

  // サーバーサイド: 1ページ目のデータを取得（ISRキャッシュ有効）
  const [actressInfo, { items, total_count }] = await Promise.all([
    fetchActressInfo(actressId),
    fetchItems({
      sort: 'rank',
      hits: ITEMS_PER_PAGE,
      page: 1,
      article: 'actress',
      article_id: actressId,
    }),
  ]);

  // 女優が見つからない場合
  if (!actressInfo && items.length === 0) {
    notFound();
  }

  const actressName = actressInfo?.name || '女優';
  const convertedActressInfo = actressInfo ? convertActressInfo(actressInfo) : null;

  // 構造化データ生成
  const jsonLd = generateStructuredData(actressName, items, total_count);

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: '女優検索', href: '/actresses' },
          { label: actressName, href: `/actress/${actressId}` }
        ]}
      />
      
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <h1 className="text-3xl font-bold text-gray-100 mb-6">
                {actressName}の出演作品一覧
              </h1>
              {/* 女優情報セクション */}
              {convertedActressInfo && (
                <div className="mb-6 max-w-xs mx-auto">
                  <ActressCard actress={convertedActressInfo} />
                </div>
              )}

              {/* 作品リストセクション（クライアントサイドページネーション） */}
              <ActressItemsListClient
                actressId={actressId}
                initialData={{ items, total_count }}
                initialSort="rank"
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

/**
 * 構造化データ（JSON-LD）を生成
 */
function generateStructuredData(
  actressName: string,
  items: import('@/lib/dmm').DMMItem[],
  totalCount: number
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": `${actressName}の出演作品`,
    "description": `${actressName}が出演するAV作品一覧`,
    "numberOfItems": totalCount,
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
}
