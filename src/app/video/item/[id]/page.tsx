import { cache } from 'react';
import { fetchItemDetail } from '@/lib/dmm';
import { notFound } from 'next/navigation';
import VideoSwipePlayer from '@/components/VideoSwipePlayer';
import Header from '@/components/Header';
import Breadcrumbs from '@/components/Breadcrumbs';
import { truncateAtWordBoundary, buildOgImages, buildTwitterImages } from '@/lib/seo';

interface VideoItemPageProps {
  params: Promise<{
    id: string;
  }>;
}

// ISR設定（1週間キャッシュ）
export const revalidate = 604800;

// generateStaticParamsを定義することで、動的ルートでもISRが有効になる
export async function generateStaticParams() {
  return [];
}

// 未知のパラメータでもオンデマンドで生成を許可
export const dynamicParams = true;

// React cacheでfetchItemDetailをメモ化
// generateMetadataとページ本体での重複呼び出しを防ぐ
const getItemDetail = cache(async (id: string) => {
  return fetchItemDetail(id);
});

export default async function VideoItemPage({ params }: VideoItemPageProps) {
  const { id } = await params;
  
  // アイテム情報を取得（React cacheでメモ化）
  const item = await getItemDetail(id);

  if (!item) {
    notFound();
  }

  return (
    <>
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: item.title, href: `/item/${id}` },
          { label: '無料動画', href: `/video/item/${id}` },
        ]}
      />

      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 mb-6">
            {item.title}の無料動画
          </h1>
          <VideoSwipePlayer item={item} fullscreen={true} />
        </div>
      </main>
    </>
  );
}

// メタデータの生成
export async function generateMetadata({ params }: VideoItemPageProps) {
  const { id } = await params;
  // React cacheでメモ化されたgetItemDetailを使用
  const item = await getItemDetail(id);

  if (!item) {
    return {
      title: '作品が見つかりません',
      description: 'お探しの作品は見つかりませんでした。',
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const description = `${item.title}の無料動画を視聴できます。`;

  const canonicalUrl = `https://www.avscope.jp/video/item/${id}`;

  const uniqueKeywords = Array.from(
    new Set([
      ...(item.iteminfo?.actress?.map((a) => a.name) || []),
      ...(item.iteminfo?.genre?.map((g) => g.name) || []),
      item.iteminfo?.maker?.[0]?.name,
      'AV',
      '動画',
      'サンプル',
    ].filter(Boolean)),
  );

  return {
    title: `${item.title} - 無料動画`,
    description: truncateAtWordBoundary(description, 160),
    keywords: uniqueKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${item.title} - 無料動画`,
      description: truncateAtWordBoundary(description, 200),
      type: 'video.other',
      url: canonicalUrl,
      siteName: 'AV Scope',
      images: buildOgImages(
        item.imageURL?.large || item.imageURL?.small,
        item.title,
        { width: 800, height: 533 },
      ),
      locale: 'ja_JP',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.title} - 無料動画`,
      description: truncateAtWordBoundary(description, 200),
      images: buildTwitterImages(item.imageURL?.large || item.imageURL?.small),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

