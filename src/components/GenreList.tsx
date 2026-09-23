'use client';

import { useState, useMemo } from 'react';
import Link from '@/components/ui/Link';
import { ROUTES } from '@/lib/constants';

interface Genre {
  genre_id: number;
  genre_name: string;
}

interface GenreListProps {
  genres: Genre[];
}

/**
 * ジャンル一覧表示コンポーネント（検索機能付き）
 */
export default function GenreList({ genres }: GenreListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // 検索クエリでフィルタリング
  const filteredGenres = useMemo(() => {
    if (!searchQuery.trim()) {
      return genres;
    }

    const query = searchQuery.trim().toLowerCase();
    return genres.filter(genre =>
      genre.genre_name.toLowerCase().includes(query)
    );
  }, [genres, searchQuery]);

  return (
    <>
      {/* 検索入力欄 */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ジャンル名で検索..."
            className="w-full px-4 py-3 pl-10 bg-[#252525] border border-[#333333] rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-500"
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
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="検索をクリア"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-gray-400">
            {filteredGenres.length}件のジャンルが見つかりました
          </p>
        )}
      </div>

      {/* ジャンルタグ一覧 */}
      <div className="bg-[#1a1a1a] rounded-lg p-6">
        {filteredGenres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredGenres.map((genre) => (
              <Link
                key={genre.genre_id}
                href={ROUTES.genre(genre.genre_id)}
                className="px-3 py-1.5 bg-[#252525] text-blue-400 rounded-full text-sm hover:bg-[#333333] hover:text-blue-300 transition-colors border border-[#333333] whitespace-nowrap"
              >
                {genre.genre_name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-2">該当するジャンルが見つかりませんでした</p>
            <p className="text-gray-500 text-sm">別のキーワードで検索してください</p>
          </div>
        )}
      </div>
    </>
  );
}
