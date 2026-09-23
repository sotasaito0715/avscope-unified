'use client';

import { useMemo } from 'react';

// ============================================
// 型定義
// ============================================

interface ClientPaginationProps {
  currentPage: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

type PageItem = number | 'ellipsis';

// ============================================
// 定数
// ============================================

const MIN_PAGES_FOR_ELLIPSIS = 7;

// ============================================
// ユーティリティ関数
// ============================================

function generatePageNumbers(currentPage: number, totalPages: number): PageItem[] {
  const pages: PageItem[] = [];

  if (totalPages <= MIN_PAGES_FOR_ELLIPSIS) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  pages.push(1);

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

// ============================================
// コンポーネント
// ============================================

/**
 * ページネーションボタン（クライアントサイド）
 */
function PaginationButton({
  onClick,
  isActive = false,
  isDisabled = false,
  children,
}: {
  onClick?: () => void;
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
    <button
      onClick={onClick}
      className={`${baseClasses} ${activeClasses}`}
    >
      {children}
    </button>
  );
}

/**
 * クライアントサイドページネーションコンポーネント
 * URLを変更せずにonPageChangeコールバックを呼び出す
 */
export default function ClientPagination({
  currentPage,
  totalCount,
  itemsPerPage,
  onPageChange,
}: ClientPaginationProps) {
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages),
    [currentPage, totalPages]
  );

  if (totalPages <= 1) {
    return null;
  }

  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      className="flex justify-center items-center gap-2 mt-8"
      aria-label="ページネーション"
    >
      {/* 前へボタン */}
      <PaginationButton
        onClick={() => onPageChange(currentPage - 1)}
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
              onClick={() => onPageChange(page)}
              isActive={isActive}
            >
              {page}
            </PaginationButton>
          );
        })}
      </div>

      {/* 次へボタン */}
      <PaginationButton
        onClick={() => onPageChange(currentPage + 1)}
        isDisabled={!hasNext}
      >
        次へ →
      </PaginationButton>
    </nav>
  );
}

