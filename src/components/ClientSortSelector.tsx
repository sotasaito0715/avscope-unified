'use client';

// ============================================
// 型定義
// ============================================

interface ClientSortSelectorProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

interface SortOption {
  value: string;
  label: string;
  icon?: string;
}

// ============================================
// 定数
// ============================================

const SORT_OPTIONS: SortOption[] = [
  { value: 'rank', label: '人気順', icon: '🔥' },
  { value: 'date', label: '発売日順', icon: '📅' },
  { value: 'price', label: '価格が高い順', icon: '💰' },
  { value: '-price', label: '価格が安い順', icon: '💸' },
  { value: 'review', label: '評価順', icon: '⭐' },
  { value: 'match', label: 'マッチング順', icon: '🎯' },
];

// ============================================
// コンポーネント
// ============================================

/**
 * クライアントサイドソート選択コンポーネント
 * URLを変更せずにonSortChangeコールバックを呼び出す
 */
export default function ClientSortSelector({ 
  currentSort, 
  onSortChange 
}: ClientSortSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="sort-select"
        className="text-sm text-gray-400 whitespace-nowrap hidden sm:inline"
      >
        並び替え:
      </label>
      <div className="relative">
        <select
          id="sort-select"
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value)}
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
          aria-label="並び替えオプションを選択"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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

/**
 * ソートオプションを取得するヘルパー関数
 */
export function getSortOption(value: string): SortOption | undefined {
  return SORT_OPTIONS.find((option) => option.value === value);
}

/**
 * デフォルトのソート値を取得
 */
export function getDefaultSort(): string {
  return SORT_OPTIONS[0].value;
}

/**
 * 全てのソートオプションを取得
 */
export function getAllSortOptions(): SortOption[] {
  return SORT_OPTIONS;
}

