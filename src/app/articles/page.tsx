/**
 * 記事一覧ページ
 *
 * @description
 * 公開されている全てのおすすめ記事を一覧表示するページ。
 * 各記事の概要をカード形式で表示し、新しい順にソートされます。
 */

import { getArticleList } from '@/lib/articles';
import Header from '@/components/Header';
import ArticleCard from '@/components/ArticleCard';
import Breadcrumbs from '@/components/Breadcrumbs';
import Link from '@/components/ui/Link';
import { Metadata } from 'next';

// ISR設定（24時間キャッシュ）
export const revalidate = 86400;
const ARTICLES_PER_PAGE = 24;

export async function generateMetadata({ searchParams }: ArticlesPageProps): Promise<Metadata> {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const isPaginated = currentPage > 1;

  return {
    title: 'おすすめ記事一覧',
    description: 'AV Scopeのおすすめ記事一覧。最新のAVトレンド、おすすめ作品、女優情報などを紹介しています。',
    openGraph: {
      title: 'おすすめ記事一覧',
      description: 'AV Scopeのおすすめ記事一覧。最新のAVトレンド、おすすめ作品、女優情報などを紹介しています。',
      url: 'https://www.avscope.jp/articles',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'おすすめ記事一覧' }],
    },
    alternates: {
      canonical: 'https://www.avscope.jp/articles',
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

interface ArticlesPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

function parsePage(page: string | undefined): number {
  if (!page) {
    return 1;
  }

  const parsed = Number.parseInt(page, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const articles = await getArticleList();
  const { page } = await searchParams;

  const totalPages = Math.max(1, Math.ceil(articles.length / ARTICLES_PER_PAGE));
  const requestedPage = parsePage(page);
  const currentPage = Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const pagedArticles = articles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);

  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;
  const prevPageHref = currentPage - 1 === 1 ? '/articles' : `/articles?page=${currentPage - 1}`;
  const nextPageHref = `/articles?page=${currentPage + 1}`;
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <Breadcrumbs
          items={[
            { label: 'おすすめ記事', href: '/articles' },
          ]}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-8">おすすめ記事</h1>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>まだ記事がありません。</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pagedArticles.map((article, index) => (
                  <ArticleCard key={article.slug} article={article} priority={index < 2} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="記事一覧のページネーション">
                  <Link
                    href={hasPrevPage ? prevPageHref : '/articles'}
                    aria-disabled={!hasPrevPage}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      hasPrevPage
                        ? 'border-[#333333] text-gray-200 hover:bg-[#222222]'
                        : 'border-[#222222] text-gray-500 pointer-events-none'
                    }`}
                  >
                    前へ
                  </Link>

                  {pageNumbers.map((pageNumber) => {
                    const href = pageNumber === 1 ? '/articles' : `/articles?page=${pageNumber}`;
                    const isCurrent = pageNumber === currentPage;
                    return (
                      <Link
                        key={pageNumber}
                        href={href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={`min-w-10 px-3 py-2 rounded-md text-sm font-medium border text-center transition-colors ${
                          isCurrent
                            ? 'border-pink-500 bg-pink-500/20 text-pink-200'
                            : 'border-[#333333] text-gray-200 hover:bg-[#222222]'
                        }`}
                      >
                        {pageNumber}
                      </Link>
                    );
                  })}

                  <Link
                    href={hasNextPage ? nextPageHref : `/articles?page=${totalPages}`}
                    aria-disabled={!hasNextPage}
                    className={`px-4 py-2 rounded-md text-sm font-medium border transition-colors ${
                      hasNextPage
                        ? 'border-[#333333] text-gray-200 hover:bg-[#222222]'
                        : 'border-[#222222] text-gray-500 pointer-events-none'
                    }`}
                  >
                    次へ
                  </Link>
                </nav>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}

