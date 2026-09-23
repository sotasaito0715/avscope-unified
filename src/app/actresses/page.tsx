import Header from '@/components/Header';
import ActressSearchForm from '@/components/ActressSearchForm';
import ActressSearchResults from '@/components/ActressSearchResults';
import Breadcrumbs from '@/components/Breadcrumbs';
import RandomAd from '@/components/RandomAd';
import { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';

// ISR設定（24時間キャッシュ）
// 検索パラメータがない場合のみISR、検索パラメータがある場合はCSR
export const revalidate = 86400;

interface ActressesPageProps {
  searchParams: Promise<{
    keyword?: string;
    page?: string;
    sort?: string;
    gte_bust?: string;
    lte_bust?: string;
    gte_waist?: string;
    lte_waist?: string;
    gte_hip?: string;
    lte_hip?: string;
    gte_height?: string;
    lte_height?: string;
    gte_birthday?: string;
    lte_birthday?: string;
  }>;
}

export async function generateMetadata({ searchParams }: ActressesPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const currentPage = Number.parseInt(page || '1', 10);
  const isPaginated = Number.isFinite(currentPage) && currentPage > 1;

  return {
    title: '女優検索',
    description: 'お気に入りの女優を探そう。サイズや身長、生年月日などの詳細な条件で検索できます。',
    alternates: {
      canonical: 'https://www.avscope.jp/actresses',
    },
    openGraph: {
      title: '女優検索',
      description: 'お気に入りの女優を探そう。詳細な条件で検索できます。',
      type: 'website',
      url: 'https://www.avscope.jp/actresses',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: '女優検索' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: '女優検索',
      description: 'お気に入りの女優を探そう。詳細な条件で検索できます。',
      images: ['/og-image.jpg'],
    },
    robots: {
      index: !isPaginated,
      follow: true,
      googleBot: {
        index: !isPaginated,
        follow: true,
      },
    },
  };
}

export default async function ActressesPage({ searchParams }: ActressesPageProps) {
  const params = await searchParams;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "女優検索",
    "description": "AV女優を条件を指定して検索",
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: '女優検索', href: '/actresses' }
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
                女優検索
              </h1>
              
              {/* 検索フォーム */}
              <ActressSearchForm initialParams={params} />
              
              {/* 検索結果 */}
              <ActressSearchResults searchParams={params} />

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

