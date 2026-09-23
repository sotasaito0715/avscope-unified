/**
 * 検索履歴管理カスタムフック
 *
 * @description
 * ユーザーの検索履歴を管理するためのReactカスタムフック。
 * ローカルストレージにデータを永続化し、履歴の追加、取得、クリア機能を提供。
 *
 * @author AV Scope Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  SearchEntry,
  SearchType,
  SearchHistoryState,
  SearchHistoryActions,
  SearchHistoryConfig,
  DEFAULT_SEARCH_HISTORY_CONFIG
} from '@/types/searchHistory';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// ============================================
// ストレージキーと設定
// ============================================

const SEARCH_HISTORY_STORAGE_KEY = STORAGE_KEYS.searchHistory;

// ============================================
// ヘルパー関数
// ============================================

/**
 * ローカルストレージから検索履歴をロード
 */
const loadSearchHistory = (): SearchEntry[] => {
  return loadFromStorage<SearchEntry[]>(SEARCH_HISTORY_STORAGE_KEY, []) ?? [];
};

/**
 * ローカルストレージに検索履歴を保存
 */
const saveSearchHistory = (history: SearchEntry[]): void => {
  saveToStorage(SEARCH_HISTORY_STORAGE_KEY, history);
};

/**
 * 古い履歴を削除（設定に基づく）
 */
const cleanupOldHistory = (history: SearchEntry[], config: SearchHistoryConfig): SearchEntry[] => {
  const now = Date.now();
  return history
    .filter(entry => now - entry.timestamp < config.maxAge)
    .slice(0, config.maxItems);
};

// ============================================
// useSearchHistory フック
// ============================================

export function useSearchHistory(config: SearchHistoryConfig = DEFAULT_SEARCH_HISTORY_CONFIG): SearchHistoryState & SearchHistoryActions {
  const [state, setState] = useState<SearchHistoryState>({
    items: [],
    isHydrated: false,
  });

  // ハイドレーション処理
  useEffect(() => {
    const loadedHistory = loadSearchHistory();
    const cleanedHistory = cleanupOldHistory(loadedHistory, config);
    
    setState({
      items: cleanedHistory,
      isHydrated: true,
    });

    // クリーンアップされた履歴を保存
    if (cleanedHistory.length !== loadedHistory.length) {
      saveSearchHistory(cleanedHistory);
    }
  }, [config]);

  /**
   * 検索履歴に新しいエントリを追加
   * 重複するクエリは最新のものとして更新
   */
  const addSearch = useCallback((query: string, type: SearchType = 'keyword', resultCount?: number) => {
    if (!state.isHydrated) return;

    setState(prevState => {
      const newEntry: SearchEntry = {
        id: `${Date.now()}-${query}`, // ユニークID
        query: query.trim(),
        type,
        timestamp: Date.now(),
        resultCount,
      };

      // 同じクエリが既に存在する場合は削除して最新として追加
      const filteredItems = prevState.items.filter(
        (entry) => entry.query !== query.trim() || entry.type !== type
      );

      const updatedItems = [newEntry, ...filteredItems].slice(0, config.maxItems);
      saveSearchHistory(updatedItems);
      return { ...prevState, items: updatedItems };
    });
  }, [state.isHydrated, config.maxItems]);

  /**
   * 検索履歴から特定のエントリを削除
   */
  const removeSearch = useCallback((id: string) => {
    if (!state.isHydrated) return;

    setState(prevState => {
      const updatedItems = prevState.items.filter(entry => entry.id !== id);
      saveSearchHistory(updatedItems);
      return { ...prevState, items: updatedItems };
    });
  }, [state.isHydrated]);

  /**
   * 検索履歴をすべてクリア
   */
  const clearHistory = useCallback(() => {
    if (!state.isHydrated) return;

    setState({ items: [], isHydrated: true });
    saveSearchHistory([]);
  }, [state.isHydrated]);

  /**
   * 最近の検索履歴を取得
   */
  const getRecentSearches = useCallback((limit: number = 10) => {
    return state.items.slice(0, limit);
  }, [state.items]);

  /**
   * 特定のタイプの検索履歴を取得
   */
  const getSearchesByType = useCallback((type: SearchType) => {
    return state.items.filter(entry => entry.type === type);
  }, [state.items]);

  return {
    ...state,
    addSearch,
    removeSearch,
    clearHistory,
    getRecentSearches,
    getSearchesByType,
  };
}
