/**
 * ローカルストレージ連携カスタムフック
 * 
 * @description
 * ローカルストレージと連携した状態管理を行う汎用的なカスタムフック。
 * ハイドレーション処理、状態管理、ローカルストレージ同期を提供。
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { loadFromStorage, saveToStorage, StorageOptions } from '@/lib/storage';

// ============================================
// 型定義
// ============================================

export interface UseLocalStorageStateOptions<T> extends StorageOptions<T> {
  sync?: boolean; // 自動同期を有効にするか（デフォルト: true）
}

// ============================================
// useLocalStorageState フック
// ============================================

/**
 * ローカルストレージと連携した状態管理フック
 * 
 * @param key - ストレージキー
 * @param initialValue - 初期値
 * @param options - オプション
 * @returns [state, setState, isHydrated]
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageStateOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const { sync = true, ...storageOptions } = options;
  
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // ハイドレーション処理
  useEffect(() => {
    const loaded = loadFromStorage<T>(key, initialValue, storageOptions);
    if (loaded !== null) {
      setState(loaded);
    }
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, initialValue]);

  // 状態更新関数
  const updateState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const newValue = typeof value === 'function' 
          ? (value as (prev: T) => T)(prev)
          : value;
        
        // 自動同期が有効な場合、ローカルストレージに保存
        if (sync && isHydrated) {
          saveToStorage(key, newValue, storageOptions);
        }
        
        return newValue;
      });
    },
    [key, sync, isHydrated, storageOptions]
  );


  return [state, updateState, isHydrated] as [
    T,
    (value: T | ((prev: T) => T)) => void,
    boolean
  ];
}

