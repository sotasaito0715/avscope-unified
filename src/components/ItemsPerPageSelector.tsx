'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

interface ItemsPerPageSelectorProps {
  currentItemsPerPage: number;
  basePath: string;
}

const ITEMS_PER_PAGE_OPTIONS = [
  { value: 20, label: '20件' },
  { value: 40, label: '40件' },
  { value: 60, label: '60件' },
  { value: 80, label: '80件' },
];

export default function ItemsPerPageSelector({ 
  currentItemsPerPage, 
  basePath 
}: ItemsPerPageSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = useCallback((newItemsPerPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('hits', newItemsPerPage.toString());
    params.set('page', '1'); // 表示件数変更時はページを1にリセット
    router.push(`${basePath}?${params.toString()}`);
  }, [router, searchParams, basePath]);

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="items-per-page-select"
        className="text-sm text-gray-400 whitespace-nowrap hidden sm:inline"
      >
        表示件数:
      </label>
      <div className="relative">
        <select
          id="items-per-page-select"
          value={currentItemsPerPage}
          onChange={(e) => handleChange(parseInt(e.target.value, 10))}
          className="
            appearance-none
            px-4 py-2 pr-10
            bg-[#1a1a1a] text-gray-100
            border border-[#333333] rounded-md
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
            text-sm
            cursor-pointer
            transition-colors
            hover:bg-[#252525]
          "
          aria-label="表示件数を選択"
        >
          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* ドロップダウンアイコン */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

