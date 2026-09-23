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

interface GenrePageProps {
  params: Promise<{
    id: string;
  }>;
}

const itemsPerPage = ITEMS_PER_PAGE;

// メタデータの生成
export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
  const { id: genreId } = await params;
  const canonical = `https://www.avscope.jp/genre/${genreId}`;
  
  try {
    const { items } = await fetchItems({
      sort: 'rank',
      hits: 1,
      page: 1,
      article: 'genre',
      article_id: genreId,
    });

    const genreName = items[0]?.iteminfo?.genre?.find(g => g.id.toString() === genreId)?.name || 'ジャンル';
    const ogImage = items[0]?.imageURL?.large || items[0]?.imageURL?.small || '';

    return {
      title: `${genreName}の作品一覧`,
      description: `${genreName}に関連するAV作品を検索。人気ランキング順、価格順、発売日順などで並び替え可能。`,
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${genreName}の作品一覧`,
        description: `${genreName}に関連するAV作品を検索。`,
        type: 'website',
        url: canonical,
        siteName: 'AV Scope',
        images: buildOgImages(ogImage, `${genreName}の作品一覧`, { width: 800, height: 533 }),
        locale: 'ja_JP',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${genreName}の作品一覧`,
        description: `${genreName}に関連するAV作品を検索。`,
        images: buildTwitterImages(ogImage),
      },
    };
  } catch {
    return {
      title: 'ジャンル検索',
      description: 'ジャンル別のAV作品検索',
      alternates: {
        canonical,
      },
    };
  }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { id: genreId } = await params;

  // サーバーサイド: 1ページ目のデータを取得（ISRキャッシュ有効）
  const { items, total_count } = await fetchItems({
    sort: 'rank',
    hits: itemsPerPage,
    page: 1,
    article: 'genre',
    article_id: genreId,
  });

  // ジャンル名を取得
  const genreName = items[0]?.iteminfo?.genre?.find(g => g.id.toString() === genreId)?.name || 'ジャンル';

  // データが見つからない場合
  if (total_count === 0) {
    notFound();
  }

  // JSON-LD構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${genreName}の作品一覧`,
    "description": `${genreName}ジャンルのAV作品コレクション`,
    "numberOfItems": total_count,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: 'ジャンル一覧', href: '/genre' },
          { label: genreName, href: `/genre/${genreId}` }
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
                categoryType="genre"
                categoryId={genreId}
                categoryName={genreName}
                initialData={{ items, total_count }}
                initialSort="rank"
                pageType="genre"
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
