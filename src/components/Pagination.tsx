'use client';

import Link from '@/components/ui/Link';
import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

// ============================================
// 型定義
// ============================================

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  basePath: string;
}

type PageItem = number | 'ellipsis';

// ============================================
// 定数
// ============================================

const MIN_PAGES_FOR_ELLIPSIS = 7; // 省略記号を表示する最小ページ数

// ============================================
// ユーティリティ関数
// ============================================

/**
 * ページ番号の配列を生成
 */
function generatePageNumbers(currentPage: number, totalPages: number): PageItem[] {
  const pages: PageItem[] = [];

  // ページ数が少ない場合は全て表示
  if (totalPages <= MIN_PAGES_FOR_ELLIPSIS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // 最初のページ
  pages.push(1);

  // 現在のページが最初の方でない場合は省略記号
  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  // 現在のページ周辺
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // 現在のページが最後の方でない場合は省略記号
  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  // 最後のページ
  pages.push(totalPages);

  return pages;
}

// ============================================
// コンポーネント
// ============================================

/**
 * ページネーションボタン
 */
function PaginationButton({
  href,
  isActive = false,
  isDisabled = false,
  children,
}: {
  href?: string;
  isActive?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
}) {
  const baseClasses = 'px-4 py-2 rounded transition-colors border';
  
  if (isDisabled) {
    return (
      <button
        disabled
        className={`${baseClasses} bg-[#1a1a1a] text-gray-600 cursor-not-allowed border-[#333333]`}
      >
        {children}
      </button>
    );
  }

  const activeClasses = isActive
    ? 'bg-red-600 text-white border-red-600'
    : 'bg-[#1a1a1a] text-gray-100 border-[#333333] hover:bg-[#252525]';

  return (
    <Link href={href!} className={`${baseClasses} ${activeClasses}`}>
      {children}
    </Link>
  );
}

/**
 * ページネーションコンポーネント
 */
export default function Pagination({
  currentPage,
  totalCount,
  itemsPerPage,
  basePath,
}: PaginationProps) {
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // ページ番号の配列をメモ化
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // ページURLを生成
  const createPageUrl = (page: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${basePath}?${params.toString()}`;
  };

  // ページが1ページ以下の場合は非表示
  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const prevUrl = hasPrevious ? createPageUrl(currentPage - 1) : undefined;
  const nextUrl = hasNext ? createPageUrl(currentPage + 1) : undefined;

  return (
    <nav
      className="flex justify-center items-center gap-2 mt-8"
      aria-label="ページネーション"
    >
      {/* 前へボタン */}
      <PaginationButton
        href={prevUrl}
        isDisabled={!hasPrevious}
      >
        ← 前へ
      </PaginationButton>

      {/* ページ番号 */}
      <div className="flex gap-2" role="list">
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-3 py-2 text-gray-500"
                aria-hidden="true"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <PaginationButton
              key={page}
              href={createPageUrl(page)}
              isActive={isActive}
            >
              {page}
            </PaginationButton>
          );
        })}
      </div>

      {/* 次へボタン */}
      <PaginationButton
        href={nextUrl}
        isDisabled={!hasNext}
      >
        次へ →
      </PaginationButton>
    </nav>
  );
}
