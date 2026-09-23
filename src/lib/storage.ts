/**
 * ローカルストレージ操作ユーティリティ
 * 
 * @description
 * ローカルストレージへの読み書きを安全に行うための共通ユーティリティ。
 * エラーハンドリングとSSR対応を含む。
 */

// ============================================
// 型定義
// ============================================

export interface StorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
  onError?: (error: Error) => void;
}

// ============================================
// 基本操作
// ============================================

/**
 * ローカルストレージからデータを読み込む
 * 
 * @param key - ストレージキー
 * @param defaultValue - デフォルト値（データが存在しない場合）
 * @param options - オプション（デシリアライザーなど）
 * @returns 読み込んだデータ、またはデフォルト値
 */
export function loadFromStorage<T>(
  key: string,
  defaultValue: T | null = null,
  options?: StorageOptions<T>
): T | null {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }

    if (options?.deserializer) {
      return options.deserializer(stored);
    }

    return JSON.parse(stored) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to load ${key} from localStorage:`, errorMessage);
    
    if (options?.onError) {
      options.onError(error instanceof Error ? error : new Error(errorMessage));
    }

    return defaultValue;
  }
}

/**
 * ローカルストレージにデータを保存
 * 
 * @param key - ストレージキー
 * @param data - 保存するデータ
 * @param options - オプション（シリアライザーなど）
 */
export function saveToStorage<T>(
  key: string,
  data: T,
  options?: StorageOptions<T>
): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = options?.serializer
      ? options.serializer(data)
      : JSON.stringify(data);
    
    localStorage.setItem(key, serialized);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to save ${key} to localStorage:`, errorMessage);
    
    if (options?.onError) {
      options.onError(error instanceof Error ? error : new Error(errorMessage));
    }
  }
}

/**
 * ローカルストレージからデータを削除
 * 
 * @param key - ストレージキー
 */
export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(key);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to remove ${key} from localStorage:`, errorMessage);
  }
}

/**
 * ローカルストレージをクリア（特定のキーのみ）
 * 
 * @param key - ストレージキー（省略時は全てクリア）
 */
export function clearStorage(key?: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to clear localStorage${key ? ` for key ${key}` : ''}:`, errorMessage);
  }
}

/**
 * ローカルストレージにキーが存在するかチェック
 * 
 * @param key - ストレージキー
 * @returns キーが存在するかどうか
 */
export function hasStorageKey(key: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

/**
 * ローカルストレージの使用量を取得（概算）
 * 
 * @returns 使用量（バイト単位の概算）
 */
export function getStorageSize(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  try {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

