/**
 * お気に入り機能の型定義ファイル
 *
 * @description
 * お気に入り機能で使用される型定義を集約。
 * 作品、女優、カテゴリ、状態管理、設定などの型を定義する。
 */

import { DMMItem, ActressInfo } from './dmm';

// ============================================
// お気に入りアイテムの基本型
// ============================================

export type FavoriteType = 'item' | 'actress';

export interface BaseFavorite {
  id: string; // content_id or actress_id
  type: FavoriteType;
  addedAt: number; // Unix timestamp
  category: string; // カスタムカテゴリ
}

export interface FavoriteItem extends BaseFavorite {
  type: 'item';
  data: DMMItem;
}

export interface FavoriteActress extends BaseFavorite {
  type: 'actress';
  data: ActressInfo;
}

export type Favorite = FavoriteItem | FavoriteActress;

// ============================================
// お気に入りカテゴリの型
// ============================================

export interface FavoriteCategory {
  id: string;
  name: string;
  icon: string;
}

// ============================================
// お気に入り状態管理の型
// ============================================

export interface FavoritesState {
  items: Favorite[];
  categories: FavoriteCategory[];
  config: FavoritesConfig;
  isHydrated: boolean; // クライアント側でハイドレーションが完了したか
}

export interface FavoritesActions {
  toggleItem: (item: DMMItem | ActressInfo, type: FavoriteType) => void;
  addItem: (item: DMMItem | ActressInfo, type: FavoriteType, category?: string) => void;
  removeItem: (id: string) => void;
  updateItemCategory: (id: string, category: string) => void;
  addCategory: (name: string, icon: string) => void;
  removeCategory: (id: string) => void;
  clearAll: () => void;
  getFavoritesByType: (type: FavoriteType) => Favorite[];
  getFavoritesByCategory: (category: string) => Favorite[];
  isFavorite: (id: string) => boolean;
}

// ============================================
// お気に入り設定の型
// ============================================

export interface FavoritesConfig {
  maxItems: number;
  maxCategories: number;
}

// ============================================
// デフォルト値
// ============================================

export const DEFAULT_FAVORITES_CONFIG: FavoritesConfig = {
  maxItems: 100,
  maxCategories: 10,
};

export const DEFAULT_CATEGORIES: FavoriteCategory[] = [
  { id: 'all', name: 'すべて', icon: '✨' },
  { id: 'favorites', name: 'お気に入り', icon: '❤️' },
];
