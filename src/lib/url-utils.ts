/**
 * URL パラメータ処理ユーティリティ
 */

// ============================================
// 型定義
// ============================================

interface BuildSearchParamsOptions {
  excludeEmpty?: boolean;
  excludeKeys?: string[];
  defaultPage?: boolean;
}

// ============================================
// URL パラメータ構築
// ============================================

/**
 * フィルターオブジェクトからURLSearchParamsを構築
 * 
 * @param filters - フィルターオブジェクト
 * @param options - オプション設定
 * @returns URLSearchParams
 * 
 * @example
 * ```typescript
 * const params = buildSearchParams(
 *   { keyword: 'test', page: '1', empty: '' },
 *   { excludeEmpty: true, excludeKeys: ['page'] }
 * );
 * // keyword=test のみが含まれる
 * ```
 */
export function buildSearchParams(
  filters: Record<string, string | number | undefined>,
  options: BuildSearchParamsOptions = {}
): URLSearchParams {
  const { 
    excludeEmpty = true, 
    excludeKeys = [],
    defaultPage = false 
  } = options;

  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    // 除外キーのチェック
    if (excludeKeys.includes(key)) return;

    // 値の型変換
    const stringValue = value?.toString() || '';

    // 空文字列の除外
    if (excludeEmpty && stringValue.trim() === '') return;

    params.set(key, stringValue);
  });

  // デフォルトページの追加
  if (defaultPage && !params.has('page')) {
    params.set('page', '1');
  }

  return params;
}

/**
 * URLSearchParamsをオブジェクトに変換
 * 
 * @param searchParams - URLSearchParams
 * @returns パラメータオブジェクト
 * 
 * @example
 * ```typescript
 * const params = new URLSearchParams('keyword=test&page=2');
 * const obj = parseSearchParams(params);
 * // { keyword: 'test', page: '2' }
 * ```
 */
export function parseSearchParams(
  searchParams: URLSearchParams
): Record<string, string> {
  const result: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    result[key] = value;
  });

  return result;
}

/**
 * URLSearchParamsからRecord<string, string | undefined>に変換
 * 
 * @param searchParams - URLSearchParams
 * @returns パラメータオブジェクト（undefinedを許容）
 */
export function parseSearchParamsOptional(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};

  if (searchParams instanceof URLSearchParams) {
    searchParams.forEach((value, key) => {
      result[key] = value;
    });
  } else {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof value === 'string') {
        result[key] = value;
      } else if (Array.isArray(value) && value.length > 0) {
        result[key] = value[0];
      }
    });
  }

  return result;
}

// ============================================
// パラメータのマージ
// ============================================

/**
 * 複数のパラメータオブジェクトをマージ
 * 
 * @param params - パラメータオブジェクトの配列
 * @returns マージされたURLSearchParams
 * 
 * @example
 * ```typescript
 * const merged = mergeSearchParams(
 *   { keyword: 'test' },
 *   { page: '2', sort: '-id' },
 *   { keyword: 'updated' } // 上書き
 * );
 * // keyword=updated&page=2&sort=-id
 * ```
 */
export function mergeSearchParams(
  ...params: Record<string, string | undefined>[]
): URLSearchParams {
  const merged: Record<string, string> = {};

  params.forEach(param => {
    Object.entries(param).forEach(([key, value]) => {
      if (value) {
        merged[key] = value;
      }
    });
  });

  return buildSearchParams(merged, { excludeEmpty: true });
}

// ============================================
// パラメータの検証
// ============================================

/**
 * 検索パラメータが有効かどうかを判定
 * 
 * @param params - 検索パラメータ
 * @param excludeKeys - チェックから除外するキー（page, sortなど）
 * @returns 有効なパラメータが存在するか
 * 
 * @example
 * ```typescript
 * hasValidSearchParams({ page: '1', sort: '-id' }, ['page', 'sort'])
 * // false (page と sort は除外される)
 * 
 * hasValidSearchParams({ keyword: 'test', page: '1' }, ['page'])
 * // true (keyword が有効)
 * ```
 */
export function hasValidSearchParams(
  params: Record<string, string | undefined>,
  excludeKeys: string[] = ['page', 'sort']
): boolean {
  return Object.entries(params).some(([key, value]) => {
    return !excludeKeys.includes(key) && value && value.trim() !== '';
  });
}

/**
 * 必須パラメータの存在チェック
 * 
 * @param params - 検索パラメータ
 * @param requiredKeys - 必須キーのリスト
 * @returns 全ての必須パラメータが存在するか
 */
export function hasRequiredParams(
  params: Record<string, string | undefined>,
  requiredKeys: string[]
): boolean {
  return requiredKeys.every(key => {
    const value = params[key];
    return value && value.trim() !== '';
  });
}

// ============================================
// パラメータの更新
// ============================================

/**
 * 既存のパラメータを保持しながら、特定のキーを更新
 * 
 * @param currentParams - 現在のパラメータ
 * @param updates - 更新する値
 * @param resetKeys - リセットするキー（例: ページ番号）
 * @returns 更新されたURLSearchParams
 * 
 * @example
 * ```typescript
 * const current = { keyword: 'test', page: '2', sort: '-id' };
 * const updated = updateSearchParams(
 *   current,
 *   { keyword: 'new' },
 *   ['page'] // ページをリセット
 * );
 * // keyword=new&sort=-id&page=1
 * ```
 */
export function updateSearchParams(
  currentParams: Record<string, string | undefined>,
  updates: Record<string, string | undefined>,
  resetKeys: string[] = ['page']
): URLSearchParams {
  const merged = { ...currentParams, ...updates };

  // リセットするキーを削除または初期値に設定
  resetKeys.forEach(key => {
    if (key === 'page') {
      merged[key] = '1';
    } else {
      delete merged[key];
    }
  });

  return buildSearchParams(merged, { excludeEmpty: true });
}

// ============================================
// URLの構築
// ============================================

/**
 * パラメータからフルURLを構築
 * 
 * @param basePath - ベースパス（例: '/search', '/actresses'）
 * @param params - パラメータオブジェクト
 * @returns フルURL文字列
 * 
 * @example
 * ```typescript
 * buildUrl('/search', { q: 'test', page: '2' })
 * // '/search?q=test&page=2'
 * ```
 */
export function buildUrl(
  basePath: string,
  params: Record<string, string | undefined>
): string {
  const searchParams = buildSearchParams(params, { excludeEmpty: true });
  const queryString = searchParams.toString();
  
  if (!queryString) return basePath;
  
  return `${basePath}?${queryString}`;
}

/**
 * 現在のURLからパラメータを保持しつつ新しいパスに遷移
 * 
 * @param newPath - 新しいパス
 * @param currentParams - 現在のパラメータ
 * @param keepParams - 保持するパラメータのキー
 * @returns 新しいURL
 */
export function buildUrlWithPreservedParams(
  newPath: string,
  currentParams: Record<string, string | undefined>,
  keepParams: string[] = []
): string {
  const preserved: Record<string, string | undefined> = {};
  
  keepParams.forEach(key => {
    if (currentParams[key]) {
      preserved[key] = currentParams[key];
    }
  });

  return buildUrl(newPath, preserved);
}

