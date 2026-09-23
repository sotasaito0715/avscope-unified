/**
 * 記事カードコンポーネント
 *
 * @description
 * 記事一覧で使用する記事カードコンポーネント。
 * タイトル、説明、カテゴリ、タグなどを表示します。
 */

'use client';

import Link from '@/components/ui/Link';
import Image from 'next/image';
import { ArticleListItem } from '@/types/article';

interface ArticleCardProps {
  article: ArticleListItem;
  priority?: boolean;
}

export default function ArticleCard({ article, priority = false }: ArticleCardProps) {
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const ogImageUrl = article.ogImage || '/og-image.jpg';

  return (
    <Link href={`/articles/${article.slug}`}>
      <div className="bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:bg-[#252525] transition-all duration-200 cursor-pointer">
        {/* 画像 */}
        <div className="relative aspect-[16/9] bg-[#1a1a1a]">
          <Image
            src={ogImageUrl}
            alt={article.title}
            fill
            className="object-cover object-center transition-opacity duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
          {article.featured && (
            <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
              特集
            </div>
          )}
          {article.category && (
            <div className="absolute top-2 left-2 bg-gray-800 bg-opacity-75 text-white px-2 py-1 rounded text-xs">
              {article.category}
            </div>
          )}
        </div>

        {/* コンテンツ */}
        <div className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 min-h-[3rem] text-gray-100 hover:text-red-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-sm text-gray-400 line-clamp-2 mb-3">
            {article.excerpt || article.description}
          </p>

          {/* メタ情報 */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{publishedDate}</span>
            {article.updatedAt && article.updatedAt !== article.publishedAt && (
              <span className="text-gray-600">更新: {new Date(article.updatedAt).toLocaleDateString('ja-JP')}</span>
            )}
          </div>

          {/* タグ */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="text-gray-500 text-xs">+{article.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

