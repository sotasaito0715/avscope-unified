import { cache } from 'react';
import { fetchItemDetail } from '@/lib/dmm';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';
import ItemDetailWithRelatedVideos from '@/components/ItemDetailWithRelatedVideos';
// import RelatedActresses from '@/components/RelatedActresses';
import Breadcrumbs from '@/components/Breadcrumbs';
import { normalizePriceToNumber } from '@/lib/price-utils';
import RandomAd from '@/components/RandomAd';
import { logWarn } from '@/lib/logger';
import RecommendedItemsSection from '@/components/RecommendedItemsSection';
import JsonLd from '@/components/JsonLd';
import { truncateAtWordBoundary, buildOgImages, buildTwitterImages } from '@/lib/seo';
import { buildItemSeoContent } from '@/lib/item-seo-text';
// import { generateProductMetadata } from '@/components/SEOMetadata';

// ISR設定（1週間キャッシュ）
export const revalidate = 604800;

// generateStaticParamsを定義することで、動的ルートでもISRが有効になる
// 空配列を返すことで、ビルド時には生成せず、すべてオンデマンドで生成
export async function generateStaticParams() {
  return [];
}

// 未知のパラメータでもオンデマンドで生成を許可
export const dynamicParams = true;

// React cacheでfetchItemDetailをメモ化
// これにより、generateMetadataとページ本体での重複呼び出しを防ぐ
const getItemDetail = cache(async (cid: string) => {
  return fetchItemDetail(cid);
});

interface ItemPageProps {
  params: Promise<{
    cid: string;
  }>;
}

export default async function ItemPage({ params }: ItemPageProps) {
  const { cid } = await params;
  // SSRではItem詳細のみ取得（同時APIコールを排除）
  // React cacheでメモ化されたgetItemDetailを使用
  const item = await getItemDetail(cid);

  if (!item) {
    notFound();
  }

  // ItemDetail用の数値価格
  const getPriceValueForComponent = (priceString: string | undefined) => {
    return normalizePriceToNumber(priceString);
  };

  // レビュー情報の取得
  const getReviewData = () => {
    if (!item.review || item.review.count === 0) {
      return {
        ratingValue: 0,
        reviewCount: 0,
        hasReviews: false
      };
    }
    return {
      ratingValue: parseFloat(item.review.average) || 0,
      reviewCount: item.review.count || 0,
      hasReviews: true
    };
  };

  const priceValueForComponent = getPriceValueForComponent(item.prices?.price);
  const reviewData = getReviewData();
  const seoContent = buildItemSeoContent(item);
  const generatedDescription = seoContent.descriptionText;

  // 構造化データのバリデーション（Search Console対応）
  const validateStructuredData = (data: Record<string, unknown>) => {
    // 必須項目のチェック
    const requiredFields = ['name', 'image', 'description', 'sku', 'mpn'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      logWarn('Missing required fields:', missingFields);
    }
    
    // 価格の形式チェック（既に正規化済み）
    if (data.offers && typeof data.offers === 'object' && data.offers !== null) {
      const offers = data.offers as Record<string, unknown>;
      if (offers.price && offers.price === "0") {
        logWarn('Invalid price format:', offers.price);
      }
    }
    
    // 画像URLの検証
    if (data.image && typeof data.image === 'string' && data.image.startsWith('http')) {
      // 有効な画像URL
    } else {
      data.image = "";
    }
    
    // 評価の検証
    if (data.aggregateRating && typeof data.aggregateRating === 'object' && data.aggregateRating !== null) {
      const aggregateRating = data.aggregateRating as Record<string, unknown>;
      if (aggregateRating.ratingValue) {
        const rating = parseFloat(aggregateRating.ratingValue as string);
        if (isNaN(rating) || rating < 0 || rating > 5) {
          aggregateRating.ratingValue = 0;
        }
      }
    }
    
    return data;
  };

  // Product構造化データ（Search Console対応）
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": item.title || "商品名なし",
    "image": item.imageURL?.large || item.imageURL?.small || "",
    "description": generatedDescription || item.title || "商品説明なし",
    "brand": item.iteminfo?.maker?.[0]?.name ? {
      "@type": "Brand",
      "name": item.iteminfo.maker[0].name
    } : undefined,
    "sku": item.content_id || "",
    "mpn": item.product_id || "",
    "offers": {
      "@type": "Offer",
      "price": item.prices?.price, // 既に正規化済み
      "priceCurrency": "JPY",
      "availability": "https://schema.org/InStock",
      "url": item.affiliateURL || item.URL || "",
      // priceValidUntilは動的なDate()を使用するとISRが無効化されるため省略
      // Schema.orgの仕様では任意フィールド
      "seller": {
        "@type": "Organization",
        "name": "DMM.com"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": reviewData.ratingValue,
      "reviewCount": reviewData.reviewCount,
      "bestRating": 5,
      "worstRating": 1
    },
    "review": reviewData.hasReviews ? [{
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "ユーザー"
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": reviewData.ratingValue,
        "bestRating": 5,
        "worstRating": 1
      },
      "reviewBody": `${item.title}のレビュー`
    }] : [],
    // releaseDateはitem.dateがある場合のみ設定（動的なDate()を使用するとISRが無効化される）
    ...(item.date ? { "releaseDate": item.date } : {})
  };

  // 構造化データをバリデーション
  const validatedProductJsonLd = validateStructuredData(productJsonLd);

  // デバッグ用ログ（本番環境では削除）
  // console.log('🔍 構造化データ価格デバッグ:');
  // console.log('  バリデーション前の価格:', productJsonLd.offers);
  // console.log('  バリデーション後の価格:', validatedProductJsonLd.offers);

  // Videoオブジェクト（無料動画がある場合）
  const videoJsonLd = item.sampleMovieURL ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": `${item.title} -無料動画`,
    "description": generatedDescription || item.title,
    "thumbnailUrl": item.imageURL?.large || item.imageURL?.small,
    "uploadDate": item.date,
    "contentUrl": item.sampleMovieURL.size_720_480 || item.sampleMovieURL.size_644_414 || item.sampleMovieURL.size_560_360
  } : null;


  return (
    <>
      {/* Product構造化データ */}
      <JsonLd data={validatedProductJsonLd} />
      {/* Video構造化データ */}
      {videoJsonLd && (
        <JsonLd data={videoJsonLd} />
      )}
      <Header />
      
      {/* パンくずリスト */}
      <Breadcrumbs
        items={[
          { label: item.title, href: `/item/${cid}` }
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
        {/* 商品詳細 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-3">
              <div className="bg-black">
                <ItemDetailWithRelatedVideos
                  item={item}
                  priceValue={priceValueForComponent}
                  pageType="item"
                  generatedDescription={generatedDescription}
                  h2Title={seoContent.h2Title}
                />
              </div>

              {/* モバイル用横長バナー（コンテンツ中間） */}
              <div className="lg:hidden w-full py-6">
                <RandomAd 
                  placement="banner"
                  className="flex justify-center"
                />
              </div>

              {/* 関連女優（CSR） - 非表示（APIコール削減のため） */}
              {/* <RelatedActresses currentItem={item} maxCount={8} /> */}

              {/* おすすめ作品（SSR、キャッシュから取得） */}
              <RecommendedItemsSection
                excludeContentId={item.content_id}
                count={8}
              />
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

// メタデータの生成
export async function generateMetadata({ params }: ItemPageProps) {
  const { cid } = await params;
  // React cacheでメモ化されたgetItemDetailを使用（ページ本体と同じデータを再利用）
  const item = await getItemDetail(cid);

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

  const seoContent = buildItemSeoContent(item);
  const makerName = item.iteminfo?.maker?.[0]?.name || '';
  const description = seoContent.metaDescription;

  const canonicalUrl = `https://www.avscope.jp/item/${cid}`;

  const uniqueKeywords = Array.from(
    new Set([
      ...(item.iteminfo?.actress?.map((a) => a.name) || []),
      ...(item.iteminfo?.genre?.map((g) => g.name) || []),
      makerName,
      'AV',
      '動画',
    ].filter(Boolean)),
  );

  return {
    title: seoContent.pageTitle,
    description: truncateAtWordBoundary(description, 160),
    keywords: uniqueKeywords,
    authors: [{ name: makerName }],
    creator: makerName,
    publisher: 'DMM.com',
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoContent.pageTitle,
      description: truncateAtWordBoundary(description, 200),
      type: 'website',
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
      title: seoContent.pageTitle,
      description: truncateAtWordBoundary(description, 200),
      images: buildTwitterImages(item.imageURL?.large || item.imageURL?.small),
      creator: '@av_scope',
      site: '@av_scope',
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
    verification: {
      // Google Search Consoleの検証タグ（必要に応じて設定）
      // google: 'your-google-verification-code',
    },
  };
}

