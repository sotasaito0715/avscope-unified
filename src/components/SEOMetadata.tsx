/**
 * SEO最適化メタデータコンポーネント
 * 
 * @description
 * 動的なSEOメタデータを生成・管理するコンポーネントです。
 */

import { generateSEOMetadata, generateBreadcrumbStructuredData, generateProductStructuredData, generateFAQStructuredData } from '@/lib/seo';
import { Metadata } from 'next';

interface SEOMetadataProps {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  nofollow?: boolean;
  breadcrumbs?: Array<{ name: string; url: string }>;
  product?: {
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
  };
  faqs?: Array<{ question: string; answer: string }>;
}

/**
 * SEO最適化されたメタデータを生成
 */
export function generateOptimizedMetadata(props: SEOMetadataProps): Metadata {
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
    breadcrumbs,
    product,
    faqs,
  } = props;

  // 構造化データの生成
  const structuredData: Record<string, unknown> = {};

  // パンくずリストの構造化データ
  if (breadcrumbs && breadcrumbs.length > 0) {
    structuredData.breadcrumb = generateBreadcrumbStructuredData(breadcrumbs);
  }

  // 商品の構造化データ
  if (product) {
    structuredData.product = generateProductStructuredData(product);
  }

  // FAQの構造化データ
  if (faqs && faqs.length > 0) {
    structuredData.faq = generateFAQStructuredData(faqs);
  }

  // SEOメタデータの生成
  return generateSEOMetadata({
    title,
    description,
    keywords,
    canonicalUrl,
    ogImage,
    ogType,
    twitterCard,
    noindex,
    nofollow,
    structuredData,
  });
}

/**
 * 商品ページ用のSEOメタデータを生成
 */
export function generateProductMetadata(product: {
  title: string;
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
  breadcrumbs?: Array<{ name: string; url: string }>;
}): Metadata {
  return generateOptimizedMetadata({
    title: product.title,
    description: product.description,
    keywords: [
      product.title,
      product.brand || '',
      'AV',
      '動画',
      'DMM',
      'FANZA',
    ].filter(Boolean),
    canonicalUrl: product.url,
    ogImage: product.image,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    breadcrumbs: product.breadcrumbs,
    product: {
      name: product.title,
      description: product.description,
      image: product.image,
      price: product.price,
      currency: product.currency || 'JPY',
      availability: product.availability || 'https://schema.org/InStock',
      brand: product.brand,
      sku: product.sku,
      url: product.url,
      aggregateRating: product.aggregateRating,
    },
  });
}

/**
 * 記事ページ用のSEOメタデータを生成
 */
export function generateArticleMetadata(article: {
  title: string;
  description: string;
  image?: string;
  author?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}): Metadata {
  return generateOptimizedMetadata({
    title: article.title,
    description: article.description,
    keywords: [
      article.title,
      article.author || '',
      'AV',
      '動画',
      'DMM',
      'FANZA',
    ].filter(Boolean),
    canonicalUrl: article.url,
    ogImage: article.image,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    breadcrumbs: article.breadcrumbs,
  });
}

/**
 * 検索ページ用のSEOメタデータを生成
 */
export function generateSearchMetadata(query: string, resultCount: number): Metadata {
  const title = query ? `「${query}」の検索結果` : '検索';
  const description = query 
    ? `「${query}」の検索結果（${resultCount}件）。AV作品、女優、ジャンルで絞り込んでお気に入りの作品を見つけましょう。`
    : 'AV作品を検索できます。キーワード、女優、ジャンルで絞り込んでお気に入りの作品を見つけましょう。';

  return generateOptimizedMetadata({
    title,
    description,
    keywords: [
      query,
      'AV検索',
      '動画検索',
      '女優検索',
      'AV Scope',
    ].filter(Boolean),
    canonicalUrl: 'https://www.avscope.jp/search',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });
}

/**
 * カテゴリページ用のSEOメタデータを生成
 */
export function generateCategoryMetadata(category: {
  name: string;
  description: string;
  url: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
}): Metadata {
  return generateOptimizedMetadata({
    title: `${category.name}の作品一覧`,
    description: category.description,
    keywords: [
      category.name,
      'AV',
      '動画',
      'DMM',
      'FANZA',
      'AV Scope',
    ],
    canonicalUrl: category.url,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    breadcrumbs: category.breadcrumbs,
  });
}
