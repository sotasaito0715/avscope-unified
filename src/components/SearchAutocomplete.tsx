'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useOfflineSearch } from '@/hooks/useOfflineSearch';
import { ROUTES } from '@/lib/constants';

// 環境変数を直接読み込む（クライアントコンポーネント用）
// デフォルトは 'false'（OFF）
const ENABLE_SEARCH_SUGGESTIONS = (process.env.NEXT_PUBLIC_ENABLE_SEARCH_SUGGESTIONS || 'false') === 'true';

interface SearchAutocompleteProps {
  query: string;
  onSelect: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  text: string;
  type: 'actress' | 'genre';
  id: number;
  ruby?: string;
}

interface Suggestion {
  text: string;
  type: 'history' | 'actress' | 'genre';
  count?: number;
  id?: number;
  ruby?: string;
}

export default function SearchAutocomplete({
  query,
  onSelect,
  isOpen,
  onClose,
}: SearchAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [offlineResults, setOfflineResults] = useState<SearchResult[]>([]);
  const { items: searchHistory, isHydrated } = useSearchHistory();
  const { searchAsync: offlineSearchAsync, isLoading: isOfflineSearchLoading } = useOfflineSearch();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  // オフライン検索を実行（機能フラグが有効な場合のみ）
  useEffect(() => {
    // 機能フラグが無効な場合はオフライン検索を実行しない
    if (!ENABLE_SEARCH_SUGGESTIONS) {
      setOfflineResults([]);
      return;
    }

    if (!isOpen || !isHydrated || !query.trim()) {
      setOfflineResults([]);
      return;
    }

    let isCancelled = false;

    const performSearch = async () => {
      try {
        const results = await offlineSearchAsync(query, 10);
        if (!isCancelled) {
          setOfflineResults(results);
        }
      } catch {
        if (!isCancelled) {
          setOfflineResults([]);
        }
      }
    };

    // デバウンス: 300ms待機してから検索を実行
    const timeoutId = setTimeout(performSearch, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query, isOpen, isHydrated, offlineSearchAsync]);

  // サジェスションを生成（検索履歴、女優、ジャンル）
  useEffect(() => {
    if (!isOpen || !isHydrated) {
      setSuggestions([]);
      return;
    }

    if (!query.trim()) {
      // クエリが空の場合は検索履歴を表示（最大10件）
      const historySuggestions: Suggestion[] = searchHistory
        .slice(0, 10)
        .map(entry => ({
          text: entry.query,
          type: 'history' as const,
          count: entry.resultCount,
        }));

      setSuggestions(historySuggestions);
      return;
    }

    const allSuggestions: Suggestion[] = [];

    // 1. 検索履歴から一致するものをフィルタリング（最大5件）
    const historyMatches = searchHistory
      .filter(entry => entry.query.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(entry => ({
        text: entry.query,
        type: 'history' as const,
        count: entry.resultCount,
      }));

    allSuggestions.push(...historyMatches);

    // 2. オフライン検索結果を追加（最大10件、履歴と合わせて最大15件）
    const offlineSuggestions: Suggestion[] = offlineResults.map(result => ({
      text: result.text,
      type: result.type,
      id: result.id,
      ruby: result.ruby,
    }));

    allSuggestions.push(...offlineSuggestions);

    // 最大15件に制限
    setSuggestions(allSuggestions.slice(0, 15));
  }, [query, isOpen, isHydrated, searchHistory, offlineResults]);

  // 外部クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('input')
      ) {
        onClose();
      }
    };

    if (isOpen) {
      // clickイベントを使用して、onClickが発火した後に閉じる
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // サジェスション選択（遷移処理を含む）
  const handleSuggestionSelect = useCallback((suggestion: Suggestion) => {
    // 女優またはジャンルの場合は直接遷移（検索履歴に追加しない）
    if (suggestion.type === 'actress' && suggestion.id) {
      router.push(ROUTES.actress(suggestion.id));
      onClose();
      return;
    }
    
    if (suggestion.type === 'genre' && suggestion.id) {
      router.push(ROUTES.genre(suggestion.id));
      onClose();
      return;
    }
    
    // 検索履歴の場合は検索結果ページに遷移（検索履歴に追加される）
    onSelect(suggestion.text);
    setSelectedIndex(-1);
  }, [router, onSelect, onClose]);

  // キーボードナビゲーション
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSuggestionSelect(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            handleSuggestionSelect(suggestions[0]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    },
    [isOpen, suggestions, selectedIndex, handleSuggestionSelect, onClose]
  );


  // サジェスション選択（クリック時）
  const handleSelect = (e: React.MouseEvent, suggestion: Suggestion) => {
    e.preventDefault();
    e.stopPropagation();
    handleSuggestionSelect(suggestion);
  };

  if (!isOpen || !isHydrated) return null;

  // タイプ別のアイコンとラベル
  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'history':
        return '🕐';
      case 'actress':
        return '👤';
      case 'genre':
        return '🏷️';
      default:
        return '🔍';
    }
  };

  const getTypeLabel = (type: Suggestion['type']) => {
    switch (type) {
      case 'history':
        return '履歴';
      case 'actress':
        return '女優';
      case 'genre':
        return 'ジャンル';
      default:
        return '';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#333333] rounded-md shadow-lg max-h-96 overflow-y-auto"
      onKeyDown={handleKeyDown}
    >
      {suggestions.length === 0 ? (
        <div className="px-4 py-3 text-gray-400 text-sm">
          {query.trim() 
            ? (isOfflineSearchLoading 
                ? '検索中...' 
                : '')
            : '検索キーワードを入力してください'}
        </div>
      ) : (
        <ul className="py-1">
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.type}-${suggestion.id || suggestion.text}-${index}`}
              className={`px-4 py-2 cursor-pointer hover:bg-[#252525] transition-colors ${
                index === selectedIndex ? 'bg-[#252525]' : ''
              }`}
              onClick={(e) => handleSelect(e, suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-500 text-xs flex-shrink-0">
                    {getTypeIcon(suggestion.type)}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-gray-100 text-sm truncate">
                      {suggestion.text}
                    </span>
                    {suggestion.ruby && (
                      <span className="text-gray-500 text-xs">
                        {suggestion.ruby}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-600 text-xs flex-shrink-0 ml-2">
                    {getTypeLabel(suggestion.type)}
                  </span>
                </div>
                {suggestion.count !== undefined && (
                  <span className="text-gray-500 text-xs ml-2 flex-shrink-0">
                    {suggestion.count.toLocaleString()}件
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

