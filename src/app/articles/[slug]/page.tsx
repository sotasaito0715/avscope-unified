/**
 * 記事詳細ページ
 *
 * @description
 * 個別のおすすめ記事を表示するページ。
 * Markdown本文を表示し、SEO最適化されたメタデータを設定します。
 */

import { getArticleBySlug, getArticleList, toEvergreenArticleSlug } from '@/lib/articles';
import { ActressInfo, DMMItem } from '@/types/dmm';
import Header from '@/components/Header';
import ArticleContent from '@/components/ArticleContent';
import Breadcrumbs from '@/components/Breadcrumbs';
import { notFound, redirect } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { extractPlainTextFromMarkdown } from '@/lib/markdown-utils';
import JsonLd from '@/components/JsonLd';
import ArticleConversionLinks from '@/components/ArticleConversionLinks';
import { buildOgImages, buildTwitterImages, resolveOgImageUrl, SEO_CONSTANTS } from '@/lib/seo';
import ArticleFAQ from '@/components/ArticleFAQ';

interface ArticlePageProps {
  params: Promise<{
    slug: string;
  }>;
}

async function loadArticle(slug: string) {
  const article = await getArticleBySlug(slug);
  if (article) return article;
  const evergreen = toEvergreenArticleSlug(slug);
  if (evergreen !== slug && (await getArticleBySlug(evergreen))) {
    redirect(`/articles/${evergreen}`);
  }
  notFound();
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await loadArticle(slug);

  // 記事ページからはAPIリクエストを送らない（パフォーマンスとコスト削減のため）

  // 1. 同じ女優の動画を取得しない（APIリクエストを発生させない）
  const sameActressItems: DMMItem[] = [];

  // 2. この作品を閲覧した人はこちらも見ています（APIリクエストを発生させない）
  const viewedTogetherItems: DMMItem[] = [];

  // 既存の関連作品（後方互換性のため、空配列として保持）
  const relatedItems: DMMItem[] = [];

  // 関連女優を取得（必要に応じて実装）
  const relatedActresses: ActressInfo[] = [];

  // 関連記事を取得（relatedArticleSlugs 優先、なければカテゴリ/タグ一致）
  const relatedArticles = await (async () => {
    try {
      const allArticles = await getArticleList();
      const currentArticle = article;
      const explicitSlugs = currentArticle.metadata.relatedArticleSlugs;

      if (explicitSlugs && explicitSlugs.length > 0) {
        const bySlug = new Map(allArticles.map((a) => [a.slug, a]));
        return explicitSlugs
          .map((s) => bySlug.get(s))
          .filter((a): a is NonNullable<typeof a> => Boolean(a && a.slug !== currentArticle.metadata.slug))
          .slice(0, 5);
      }

      return allArticles
        .filter((a) =>
          a.slug !== currentArticle.metadata.slug &&
          (a.category === currentArticle.metadata.category ||
           (a.tags && currentArticle.metadata.tags &&
            a.tags.some(tag => currentArticle.metadata.tags?.includes(tag))))
        )
        .slice(0, 5);
    } catch {
      return [];
    }
  })();

  const publishedDate = new Date(article.metadata.publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const updatedDate = article.metadata.updatedAt
    ? new Date(article.metadata.updatedAt).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const canonicalUrl = article.metadata.canonicalUrl || `https://www.avscope.jp/articles/${slug}`;
  const ogImageUrl = resolveOgImageUrl(article.metadata.ogImage);

  // Article構造化データ（SEO対策）
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.metadata.title,
    "description": article.metadata.description,
    "image": ogImageUrl.startsWith('http') ? ogImageUrl : `${SEO_CONSTANTS.SITE_URL}${ogImageUrl}`,
    "datePublished": article.metadata.publishedAt,
    "dateModified": article.metadata.updatedAt || article.metadata.publishedAt,
    "author": article.metadata.author ? {
      "@type": "Person",
      "name": article.metadata.author.name,
      "role": article.metadata.author.role,
    } : {
      "@type": "Organization",
      "name": "AV Scope編集部",
    },
    "publisher": {
      "@type": "Organization",
      "name": "AV Scope",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.avscope.jp/favicon.svg",
      },
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    "keywords": article.metadata.keywords?.join(', '),
    "articleSection": article.metadata.category,
    "articleBody": extractPlainTextFromMarkdown(article.content), // プレーンテキストのみ（HTML含めない）
  };

  const faqEntries = article.metadata.faq;

  const howToEntry = article.metadata.howTo;
  const howToJsonLd =
    howToEntry && howToEntry.steps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": howToEntry.name,
          "step": howToEntry.steps.map((text, index) => ({
            "@type": "HowToStep",
            "position": index + 1,
            "text": text,
          })),
        }
      : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <Breadcrumbs
          items={[
            { label: 'おすすめ記事', href: '/articles' },
            { label: article.metadata.title, href: `/articles/${slug}` },
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <article className="bg-[#1a1a1a] rounded-lg shadow-lg p-6 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
              {article.metadata.title}
            </h1>
            <div className="text-gray-400 text-sm mb-6 flex flex-wrap gap-x-4 gap-y-2">
              <span>公開日: {publishedDate}</span>
              {updatedDate && updatedDate !== publishedDate && (
                <span>更新日: {updatedDate}</span>
              )}
              {article.metadata.author && (
                <span>著者: {article.metadata.author.name}</span>
              )}
              {article.metadata.category && (
                <span>カテゴリ: {article.metadata.category}</span>
              )}
            </div>
            {article.metadata.ogImage && (
              <div className="relative w-full aspect-video mb-8 rounded-lg overflow-hidden">
                <Image
                  src={article.metadata.ogImage}
                  alt={article.metadata.ogImageAlt || article.metadata.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 80vw"
                  priority
                  unoptimized
                />
              </div>
            )}
            <ArticleContent
              content={article.content}
              relatedItems={relatedItems}
              relatedActresses={relatedActresses}
              sameActressItems={sameActressItems}
              viewedTogetherItems={viewedTogetherItems}
            />

            {faqEntries && faqEntries.length > 0 && (
              <ArticleFAQ items={faqEntries} />
            )}

            {/* 関連記事の表示 */}
            {relatedArticles.length > 0 && (
              <div className="mt-12 pt-8 border-t border-[#333333]">
                <h2 className="text-2xl font-bold text-gray-100 mb-6">関連記事</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {relatedArticles.map((relatedArticle) => (
                    <Link
                      key={relatedArticle.slug}
                      href={`/articles/${relatedArticle.slug}`}
                      className="block bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#252525] transition-colors"
                    >
                      <h3 className="font-semibold text-lg text-gray-100 mb-2 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        {relatedArticle.excerpt || relatedArticle.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {relatedArticle.category && (
                          <span className="bg-gray-700 px-2 py-1 rounded">
                            {relatedArticle.category}
                          </span>
                        )}
                        <span>
                          {new Date(relatedArticle.publishedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <ArticleConversionLinks itemIds={article.metadata.relatedItems} />
          </article>
        </div>
      </main>
      {/* 構造化データ群（独立したJSON-LDタグ） */}
      <JsonLd data={articleJsonLd} />
      {howToJsonLd && <JsonLd data={howToJsonLd} />}
    </>
  );
}

export async function generateStaticParams() {
  const articles = await getArticleList();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// メタデータの生成
export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await loadArticle(slug);

  const canonicalUrl = article.metadata.canonicalUrl || `https://www.avscope.jp/articles/${slug}`;

  return {
    title: article.metadata.title,
    description: article.metadata.description,
    keywords: article.metadata.keywords,
    authors: article.metadata.author ? [{ name: article.metadata.author.name }] : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.metadata.title,
      description: article.metadata.description,
      type: 'article',
      url: canonicalUrl,
      siteName: 'AV Scope',
      images: buildOgImages(
        article.metadata.ogImage,
        article.metadata.ogImageAlt || article.metadata.title,
        { width: 1200, height: 630 },
      ),
      locale: 'ja_JP',
      publishedTime: article.metadata.publishedAt,
      modifiedTime: article.metadata.updatedAt,
      tags: article.metadata.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metadata.title,
      description: article.metadata.description,
      images: buildTwitterImages(article.metadata.ogImage),
    },
    robots: {
      index: !article.metadata.noindex,
      follow: !article.metadata.nofollow,
      googleBot: {
        index: !article.metadata.noindex,
        follow: !article.metadata.nofollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

