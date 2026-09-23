/**
 * 検索フォームコンポーネント
 * 
 * @description
 * ヘッダーの検索フォームを表示するコンポーネント
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchAutocomplete from '../SearchAutocomplete';
import { useSearchHistory } from '@/hooks/useSearchHistory';

interface SearchFormProps {
  variant?: 'desktop' | 'mobile';
  onSearch?: () => void;
}

export default function SearchForm({ variant = 'desktop', onSearch }: SearchFormProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
  const router = useRouter();
  const { addSearch } = useSearchHistory();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addSearch(searchQuery.trim(), 'keyword');
      setIsAutocompleteOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onSearch?.();
    }
  };

  const handleSearchSelect = (query: string) => {
    setSearchQuery(query);
    setIsAutocompleteOpen(false);
    if (query.trim()) {
      addSearch(query.trim(), 'keyword');
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      onSearch?.();
    }
  };

  const inputClassName = variant === 'desktop'
    ? 'block w-full pl-10 pr-3 py-2 border border-[#333333] rounded-md leading-5 bg-[#0a0a0a] text-gray-100 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-red-500 focus:border-red-500 sm:text-sm'
    : 'block w-full pl-9 pr-3 py-2 border border-[#333333] rounded-md leading-5 bg-[#0a0a0a] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm';

  const iconSize = variant === 'desktop' ? 'h-5 w-5' : 'h-4 w-4';
  const iconPadding = variant === 'desktop' ? 'pl-3' : 'pl-3';

  return (
    <form onSubmit={handleSearch} className={variant === 'desktop' ? 'flex items-center flex-shrink-0 self-start' : 'flex items-center gap-2'}>
      <div className={variant === 'desktop' ? 'relative w-full max-w-md' : 'relative flex-1'}>
        <div className={`absolute inset-y-0 left-0 ${iconPadding} flex items-center pointer-events-none`}>
          <svg
            className={`${iconSize} text-gray-500`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsAutocompleteOpen(true);
          }}
          onFocus={() => setIsAutocompleteOpen(true)}
          placeholder={variant === 'desktop' ? 'キーワードで検索...' : 'キーワード検索...'}
          className={inputClassName}
        />
        <SearchAutocomplete
          query={searchQuery}
          onSelect={handleSearchSelect}
          isOpen={isAutocompleteOpen}
          onClose={() => setIsAutocompleteOpen(false)}
        />
      </div>
      <button
        type="submit"
        className={variant === 'desktop'
          ? 'ml-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors whitespace-nowrap flex-shrink-0'
          : 'px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors whitespace-nowrap'
        }
      >
        検索
      </button>
    </form>
  );
}

