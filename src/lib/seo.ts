/**
 * SEO最適化ライブラリ
 * 
 * @description
 * 包括的なSEO最適化のためのユーティリティ関数を提供します。
 * メタデータ、構造化データ、パフォーマンス最適化を含みます。
 */

import { Metadata } from 'next';

// ============================================
// 型定義
// ============================================

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  nofollow?: boolean;
  structuredData?: Record<string, unknown>;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

// ============================================
// 定数
// ============================================

export const SEO_CONSTANTS = {
  SITE_NAME: 'AV Scope',
  SITE_DESCRIPTION: 'あらゆるAVを、ひと目で。',
  SITE_URL: 'https://www.avscope.jp',
  TWITTER_HANDLE: '@av_scope',
  DEFAULT_OG_IMAGE: '/og-image.jpg',
  DEFAULT_LOCALE: 'ja_JP',
  MAX_DESCRIPTION_LENGTH: 160,
  MAX_TITLE_LENGTH: 60,
} as const;

export function resolveOgImageUrl(url?: string | null): string {
  if (typeof url === 'string' && url.trim() !== '') {
    return url;
  }
  return SEO_CONSTANTS.DEFAULT_OG_IMAGE;
}

export function buildOgImages(
  url?: string | null,
  alt?: string,
  size?: { width: number; height: number },
) {
  const resolved = resolveOgImageUrl(url);
  const isDefault = resolved === SEO_CONSTANTS.DEFAULT_OG_IMAGE;
  return [
    {
      url: resolved,
      width: size?.width ?? (isDefault ? 1200 : 800),
      height: size?.height ?? (isDefault ? 630 : 533),
      alt: alt || SEO_CONSTANTS.SITE_NAME,
    },
  ];
}

export function buildTwitterImages(url?: string | null): string[] {
  return [resolveOgImageUrl(url)];
}

export function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const slicePoint = Math.max(1, maxLength - 1);
  const truncated = text.slice(0, slicePoint);
  const separatorPattern = /[\s、。・|,.;:!?！？]/g;

  let lastSeparatorIndex = -1;
  let match: RegExpExecArray | null;
  while ((match = separatorPattern.exec(truncated)) !== null) {
    lastSeparatorIndex = match.index;
  }

  const useSeparatorIndex = lastSeparatorIndex >= Math.floor(maxLength * 0.6);
  const naturalText = useSeparatorIndex
    ? truncated.slice(0, lastSeparatorIndex + 1).trim()
    : truncated.trim();

  return `${naturalText}…`;
}

// ============================================
// SEOメタデータ生成
// ============================================

/**
 * SEO最適化されたメタデータを生成
 */
export function generateSEOMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    noindex = false,
    nofollow = false,
  } = config;

  // タイトルと説明文の最適化
  const optimizedTitle = truncateAtWordBoundary(title, SEO_CONSTANTS.MAX_TITLE_LENGTH);
  const optimizedDescription = truncateAtWordBoundary(
    description,
    SEO_CONSTANTS.MAX_DESCRIPTION_LENGTH,
  );
  const resolvedOgImage = resolveOgImageUrl(ogImage);

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    keywords: keywords.length > 0 ? keywords : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      type: ogType,
      url: canonicalUrl,
      siteName: SEO_CONSTANTS.SITE_NAME,
      locale: SEO_CONSTANTS.DEFAULT_LOCALE,
      images: [
        {
          url: resolvedOgImage,
          width: 1200,
          height: 630,
          alt: optimizedTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: optimizedTitle,
      description: optimizedDescription,
      images: [resolvedOgImage],
      creator: SEO_CONSTANTS.TWITTER_HANDLE,
      site: SEO_CONSTANTS.TWITTER_HANDLE,
    },
    robots: {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      // Google Search Console検証タグ（必要に応じて設定）
      // google: 'your-google-verification-code',
    },
  };
}

// ============================================
// 構造化データ生成
// ============================================

/**
 * パンくずリストの構造化データを生成
 */
export function generateBreadcrumbStructuredData(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * 商品の構造化データを生成
 */
export function generateProductStructuredData(product: {
  name: string;
  description: string;
  image?: string;
  price?: string;
  currency?: string;
  availability?: string;
  brand?: string;
  sku?: string;
  url: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    ...(product.image && { image: product.image }),
    ...(product.price && {
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'JPY',
        availability: product.availability || 'https://schema.org/InStock',
        url: product.url,
      },
    }),
    ...(product.brand && {
      brand: {
        '@type': 'Brand',
        name: product.brand,
      },
    }),
    ...(product.sku && { sku: product.sku }),
    ...(product.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.aggregateRating.ratingValue,
        reviewCount: product.aggregateRating.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };
}

/**
 * 記事の構造化データを生成
 */
export function generateArticleStructuredData(article: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    ...(article.image && { image: article.image }),
    ...(article.author && {
      author: {
        '@type': 'Person',
        name: article.author,
      },
    }),
    datePublished: article.datePublished,
    ...(article.dateModified && { dateModified: article.dateModified }),
    url: article.url,
  };
}

/**
 * FAQの構造化データを生成
 */
export function generateFAQStructuredData(faqs: Array<{
  question: string;
  answer: string;
}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ============================================
// パフォーマンス最適化
// ============================================

/**
 * 画像の最適化設定を生成
 */
export function generateImageOptimizationConfig() {
  return {
    formats: ['image/webp', 'image/avif'],
    quality: 80,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    priority: false,
  };
}

/**
 * プリロード設定を生成
 */
export function generatePreloadConfig(resources: Array<{
  href: string;
  as: string;
  type?: string;
}>) {
  return resources.map(resource => ({
    rel: 'preload',
    href: resource.href,
    as: resource.as,
    ...(resource.type && { type: resource.type }),
  }));
}

// ============================================
// アクセシビリティ
// ============================================

/**
 * アクセシビリティ用のメタデータを生成
 */
export function generateAccessibilityMetadata() {
  return {
    'color-scheme': 'dark',
    'theme-color': '#1a1a1a',
    'msapplication-TileColor': '#1a1a1a',
  };
}

// ============================================
// 国際化
// ============================================

/**
 * 多言語対応のメタデータを生成
 */
export function generateInternationalizationMetadata(locale: string = 'ja') {
  return {
    'content-language': locale,
    'language': locale,
    'geo.region': 'JP',
    'geo.country': 'Japan',
  };
}
