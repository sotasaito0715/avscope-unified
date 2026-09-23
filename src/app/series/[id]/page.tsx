import { fetchItems } from '@/lib/dmm';
import Header from '@/components/Header';
import CategoryItemsListClient from '@/components/CategoryItemsListClient';
import { notFound } from 'next/navigation';
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

interface SeriesPageProps {
  params: Promise<{
    id: string;
  }>;
}

const itemsPerPage = ITEMS_PER_PAGE;

// メタデータの生成
export async function generateMetadata({ params }: SeriesPageProps): Promise<Metadata> {
  const { id: seriesId } = await params;
  const canonical = `https://www.avscope.jp/series/${seriesId}`;
  
  try {
    const { items } = await fetchItems({
      sort: 'rank',
      hits: 1,
      page: 1,
      article: 'series',
      article_id: seriesId,
    });

    const seriesName = items[0]?.iteminfo?.series?.[0]?.name || 'シリーズ';
    const ogImage = items[0]?.imageURL?.large || items[0]?.imageURL?.small || '';

    return {
      title: `${seriesName}の作品一覧`,
      description: `${seriesName}シリーズのAV作品を検索。人気ランキング順、価格順、発売日順などで並び替え可能。`,
      alternates: {
        canonical,
      },
      openGraph: {
        title: `${seriesName}の作品一覧`,
        description: `${seriesName}シリーズのAV作品を検索。`,
        type: 'website',
        url: canonical,
        siteName: 'AV Scope',
        images: buildOgImages(ogImage, `${seriesName}の作品一覧`, { width: 800, height: 533 }),
        locale: 'ja_JP',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${seriesName}の作品一覧`,
        description: `${seriesName}シリーズのAV作品を検索。`,
        images: buildTwitterImages(ogImage),
      },
    };
  } catch {
    return {
      title: 'シリーズ検索',
      description: 'シリーズ別のAV作品検索',
      alternates: {
        canonical,
      },
    };
  }
}

export default async function SeriesPage({ params }: SeriesPageProps) {
  const { id: seriesId } = await params;

  // サーバーサイド: 1ページ目のデータを取得（ISRキャッシュ有効）
  const { items, total_count } = await fetchItems({
    sort: 'rank',
    hits: itemsPerPage,
    page: 1,
    article: 'series',
    article_id: seriesId,
  });

  // シリーズ名を取得
  const seriesName = items[0]?.iteminfo?.series?.[0]?.name || 'シリーズ';

  // データが見つからない場合
  if (total_count === 0) {
    notFound();
  }

  // JSON-LD構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `${seriesName}の作品一覧`,
    "description": `${seriesName}シリーズのAV作品コレクション`,
    "numberOfItems": total_count,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: seriesName, href: `/series/${seriesId}` }
        ]}
      />
      
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <CategoryItemsListClient
                categoryType="series"
                categoryId={seriesId}
                categoryName={seriesName}
                initialData={{ items, total_count }}
                initialSort="rank"
                showDoujinCard={true}
                pageType="series"
              />
            </div>
            
            {/* サイドバー（PCのみ） */}
            <aside className="lg:col-span-1 hidden lg:block">
              <div className="sticky top-8 space-y-6">
                {/* 広告などを配置可能 */}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
