import { Metadata } from 'next';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import RandomAd from '@/components/RandomAd';
import GenreList from '@/components/GenreList';
import { readFileSync } from 'fs';
import { join } from 'path';
import JsonLd from '@/components/JsonLd';

// 永久的なISRキャッシュ（1年 = 31536000秒）
// ジャンル一覧は変更頻度が非常に低いため、長時間キャッシュ
export const revalidate = 31536000;

interface Genre {
  genre_id: number;
  genre_name: string;
}

// ジャンルデータを読み込む
function getGenres(): Genre[] {
  try {
    const filePath = join(process.cwd(), 'data', 'genres', 'genres_summary.json');
    const fileContents = readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContents) as Genre[];
  } catch (error) {
    console.error('Failed to load genres:', error);
    return [];
  }
}

// メタデータ
export const metadata: Metadata = {
  title: 'ジャンル一覧',
  description: 'AV作品をジャンル別に検索。人気のジャンルからニッチなジャンルまで、様々なカテゴリーから作品を見つけられます。',
  alternates: {
    canonical: 'https://www.avscope.jp/genre',
  },
  openGraph: {
    title: 'ジャンル一覧',
    description: 'AV作品をジャンル別に検索。',
    type: 'website',
    url: 'https://www.avscope.jp/genre',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'ジャンル一覧' }],
  },
};

export default async function GenreListPage() {
  const genres = getGenres();

  // JSON-LD構造化データ
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "ジャンル一覧",
    "description": "AV作品をジャンル別に検索できるページ",
    "numberOfItems": genres.length,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: 'ジャンル一覧', href: '/genre' }
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
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-100 mb-4">
                  ジャンル一覧
                </h1>
                <p className="text-gray-400 text-sm mb-2">
                  {genres.length}件のジャンルから作品を検索できます
                </p>
                <p className="text-gray-500 text-xs">
                  ジャンルをクリックすると、そのジャンルの作品一覧ページに遷移します
                </p>
              </div>

              {/* ジャンル一覧（検索機能付き） */}
              <GenreList genres={genres} />

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
