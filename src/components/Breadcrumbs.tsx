'use client';

import Link from '@/components/ui/Link';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
}

/**
 * パンくずリストコンポーネント
 * 
 * @description
 * ページの階層構造を示すパンくずリストを表示します。
 * JSON-LD構造化データも自動生成してSEO効果を高めます。
 * 
 * @param items - パンくずアイテムの配列（ホームは自動追加されます）
 * 
 * @example
 * ```tsx
 * // 女優詳細ページ
 * <Breadcrumbs items={[
 *   { label: '女優一覧', href: '/actresses' },
 *   { label: '渡部ほの', href: '/actress/10000' }
 * ]} />
 * 
 * // 商品詳細ページ
 * <Breadcrumbs items={[
 *   { label: '新人NO.1 STYLE リアルはたちのJ', href: '/item/sone00969' }
 * ]} />
 * ```
 */
export default function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
  const pathname = usePathname();

  // ホームページでは表示しない
  if (pathname === '/') {
    return null;
  }

  // パンくずアイテムを生成（ホームを先頭に追加、重複を除去）
  const homeItem: BreadcrumbItem = { label: 'ホーム', href: '/' };
  
  // 既にホームが含まれている場合は重複を除去
  const filteredItems = items.filter(item => 
    !(item.href === '/' && item.label === 'ホーム')
  );
  
  const breadcrumbItems: BreadcrumbItem[] = [
    homeItem,
    ...filteredItems,
  ];

  // JSON-LD構造化データを生成
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbItems.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': `https://www.avscope.jp${item.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* パンくずリストUI */}
      <nav
        aria-label="パンくずリスト"
        className="bg-[#1a1a1a] border-b border-[#333333]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center flex-wrap gap-y-2 text-sm">
            {breadcrumbItems.map((item, index) => {
              const isLast = index === breadcrumbItems.length - 1;

              return (
                <li key={`${item.href}-${index}`} className="flex items-center">
                  {/* 矢印アイコン（最初の要素以外） */}
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 mx-2 text-gray-500 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}

                  {/* 最後の要素は現在のページなのでリンクなし */}
                  {isLast ? (
                    <span
                      className="text-gray-400 truncate max-w-[200px] sm:max-w-none"
                      aria-current="page"
                    >
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors truncate max-w-[150px] sm:max-w-none"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
    </>
  );
}

