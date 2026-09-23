/**
 * お気に入り管理カスタムフック
 *
 * @description
 * 作品や女優のお気に入りを管理するためのReactカスタムフック。
 * ローカルストレージにデータを永続化し、ハイドレーションに対応。
 *
 * @author AV Scope Team
 * @version 1.0.0
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Favorite,
  FavoriteType,
  FavoritesState,
  FavoritesActions,
  DEFAULT_FAVORITES_CONFIG,
  DEFAULT_CATEGORIES
} from '@/types/favorites';
import { DMMItem, ActressInfo } from '@/types/dmm';
import { loadFromStorage, saveToStorage } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';

// ============================================
// ストレージキー
// ============================================

const FAVORITES_STORAGE_KEY = STORAGE_KEYS.favorites;

// ============================================
// ヘルパー関数
// ============================================

/**
 * ローカルストレージからお気に入りデータをロード
 */
const loadFavorites = (): Favorite[] => {
  return loadFromStorage<Favorite[]>(FAVORITES_STORAGE_KEY, []) ?? [];
};

/**
 * ローカルストレージにお気に入りデータを保存
 */
const saveFavorites = (favorites: Favorite[]): void => {
  saveToStorage(FAVORITES_STORAGE_KEY, favorites);
};

// ============================================
// useFavorites フック
// ============================================

export function useFavorites(): FavoritesState & FavoritesActions {
  const [state, setState] = useState<FavoritesState>({
    items: [],
    categories: DEFAULT_CATEGORIES,
    config: DEFAULT_FAVORITES_CONFIG,
    isHydrated: false,
  });

  // ハイドレーション処理
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      items: loadFavorites(),
      isHydrated: true,
    }));
  }, []);

  // お気に入りアイテムの追加/削除/トグル
  const toggleItem = useCallback((item: DMMItem | ActressInfo, type: FavoriteType) => {
    setState(prevState => {
      const itemId = type === 'item' ? (item as DMMItem).content_id : (item as ActressInfo).id.toString();
      const existingIndex = prevState.items.findIndex(fav => fav.id === itemId && fav.type === type);

      let newItems;
      if (existingIndex !== -1) {
        // 既存の場合は削除
        newItems = prevState.items.filter((_, index) => index !== existingIndex);
      } else {
        // 新規の場合は追加 (デフォルトカテゴリ: 'favorites')
        const newFavorite: Favorite = type === 'item' 
          ? {
              id: itemId,
              type: 'item',
              addedAt: Date.now(),
              category: 'favorites',
              data: item as DMMItem,
            }
          : {
              id: itemId,
              type: 'actress',
              addedAt: Date.now(),
              category: 'favorites',
              data: item as ActressInfo,
            };
        newItems = [newFavorite, ...prevState.items].slice(0, prevState.config.maxItems);
      }
      saveFavorites(newItems);
      return { ...prevState, items: newItems };
    });
  }, []);

  const addItem = useCallback((item: DMMItem | ActressInfo, type: FavoriteType, category: string = 'favorites') => {
    setState(prevState => {
      const itemId = type === 'item' ? (item as DMMItem).content_id : (item as ActressInfo).id.toString();
      if (prevState.items.some(fav => fav.id === itemId && fav.type === type)) {
        return prevState; // 既に存在する場合は何もしない
      }

      const newFavorite: Favorite = type === 'item' 
        ? {
            id: itemId,
            type: 'item',
            addedAt: Date.now(),
            category,
            data: item as DMMItem,
          }
        : {
            id: itemId,
            type: 'actress',
            addedAt: Date.now(),
            category,
            data: item as ActressInfo,
          };
      const newItems = [newFavorite, ...prevState.items].slice(0, prevState.config.maxItems);
      saveFavorites(newItems);
      return { ...prevState, items: newItems };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setState(prevState => {
      const newItems = prevState.items.filter(fav => fav.id !== id);
      saveFavorites(newItems);
      return { ...prevState, items: newItems };
    });
  }, []);

  const updateItemCategory = useCallback((id: string, category: string) => {
    setState(prevState => {
      const newItems = prevState.items.map(fav =>
        fav.id === id ? { ...fav, category } : fav
      );
      saveFavorites(newItems);
      return { ...prevState, items: newItems };
    });
  }, []);

  // カテゴリ管理
  const addCategory = useCallback((name: string, icon: string) => {
    setState(prevState => {
      if (prevState.categories.length >= prevState.config.maxCategories) {
        console.warn('Max categories reached.');
        return prevState;
      }
      const newCategory = { id: name.toLowerCase().replace(/\s/g, '-'), name, icon };
      const newCategories = [...prevState.categories, newCategory];
      // カテゴリはローカルストレージに保存しない（デフォルトカテゴリのみ）
      return { ...prevState, categories: newCategories };
    });
  }, []);

  const removeCategory = useCallback((id: string) => {
    setState(prevState => {
      const newCategories = prevState.categories.filter(cat => cat.id !== id);
      const newItems = prevState.items.map(item =>
        item.category === id ? { ...item, category: 'favorites' } : item // 削除されたカテゴリのアイテムはデフォルトに戻す
      );
      saveFavorites(newItems);
      return { ...prevState, categories: newCategories, items: newItems };
    });
  }, []);

  const clearAll = useCallback(() => {
    setState(prevState => {
      saveFavorites([]);
      return { ...prevState, items: [] };
    });
  }, []);

  // フィルタリングヘルパー
  const getFavoritesByType = useCallback((type: FavoriteType) => {
    return state.items.filter(fav => fav.type === type);
  }, [state.items]);

  const getFavoritesByCategory = useCallback((category: string) => {
    return state.items.filter(fav => fav.category === category);
  }, [state.items]);

  const isFavorite = useCallback((id: string) => {
    return state.items.some(fav => fav.id === id);
  }, [state.items]);

  return {
    ...state,
    toggleItem,
    addItem,
    removeItem,
    updateItemCategory,
    addCategory,
    removeCategory,
    clearAll,
    getFavoritesByType,
    getFavoritesByCategory,
    isFavorite,
  };
}
