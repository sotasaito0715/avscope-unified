import { fetchItems } from '@/lib/dmm';
import Header from '@/components/Header';
import CategoryItemsListClient from '@/components/CategoryItemsListClient';
import { notFound } from 'next/navigation';
import RandomAd from '@/components/RandomAd';
import Breadcrumbs from '@/components/Breadcrumbs';
import { Metadata } from 'next';
import { ITEMS_PER_PAGE } from '@/lib/constants';
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

interface MakerPageProps {
  params: Promise<{
    id: string;
  }>;
}

const itemsPerPage = ITEMS_PER_PAGE;

// メタデータの生成
export async function generateMetadata({ params }: MakerPageProps): Promise<Metadata> {
  const { id: makerId } = await params;
  const canonical = `https://www.avscope.jp/maker/${makerId}`;
  
  try {
    const { items } = await fetchItems({
      sort: 'rank',
      hits: 1,
      page: 1,
      article: 'maker',
      article_id: makerId,
    });

    const makerName = items[0]?.iteminfo?.maker?.[0]?.name || 'メーカー';
    const ogImage = items[0]?.imageURL?.large || items[0]?.imageURL?.small || '';

    return {
      title: `${makerName}の作品一覧`,
      description: `${makerName}が制作したAV作品を検索。人気ランキング順、価格順、発売日順などで並び替え可能。`,
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${makerName}の作品一覧`,
        description: `${makerName}が制作したAV作品を検索。`,
        type: 'website',
        url: canonical,
        siteName: 'AV Scope',
        images: buildOgImages(ogImage, `${makerName}の作品一覧`, { width: 800, height: 533 }),
        locale: 'ja_JP',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${makerName}の作品一覧`,
        description: `${makerName}が制作したAV作品を検索。`,
        images: buildTwitterImages(ogImage),
      },
    };
  } catch {
    return {
      title: 'メーカー検索',
      description: 'メーカー別のAV作品検索',
      alternates: {
        canonical,
      },
    };
  }
}

export default async function MakerPage({ params }: MakerPageProps) {
  const { id: makerId } = await params;

  // サーバーサイド: 1ページ目のデータを取得（ISRキャッシュ有効）
  const { items, total_count } = await fetchItems({
    sort: 'rank',
    hits: itemsPerPage,
    page: 1,
    article: 'maker',
    article_id: makerId,
  });

  // メーカー名を取得
  let makerName = 'メーカー';
  let representativeImage = '';
  if (items.length > 0 && items[0].iteminfo?.maker && items[0].iteminfo.maker.length > 0) {
    makerName = items[0].iteminfo.maker[0].name;
    representativeImage = items[0].imageURL?.large || items[0].imageURL?.list || '';
  }

  // データが見つからない場合
  if (total_count === 0) {
    notFound();
  }

  // JSON-LD構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${makerName}の作品一覧`,
    "description": `${makerName}が制作したAV作品のコレクション`,
    "numberOfItems": total_count,
    ...(representativeImage && {
      "image": representativeImage
    }),
    "author": {
      "@type": "Organization",
      "name": makerName
    }
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: makerName, href: `/maker/${makerId}` }
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
              <CategoryItemsListClient
                categoryType="maker"
                categoryId={makerId}
                categoryName={makerName}
                initialData={{ items, total_count }}
                initialSort="rank"
                showDoujinCard={true}
                pageType="maker"
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
