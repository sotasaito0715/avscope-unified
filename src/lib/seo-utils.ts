/**
 * SEO最適化ユーティリティ
 * 
 * @description
 * 無限URLパターン（page/sort）をSEO的に制限し、Botのクロールを止めます。
 */

// 許可されたソート値
export const ALLOWED_SORT_VALUES = {
  items: ['rank', 'date', 'price', '-price', 'review', 'match'] as const,
  actress: ['rank', 'date', 'price', '-price', 'review'] as const,
} as const;

// ページ上限
export const MAX_PAGE = 20;

/**
 * ページ番号を検証し、上限を超えている場合は404を返す
 * 
 * @param page - ページ番号
 * @returns 有効なページ番号、またはnull（上限超過の場合）
 */
export function validatePage(page: number): number | null {
  if (page < 1) {
    return 1;
  }
  if (page > MAX_PAGE) {
    return null; // 404を返す
  }
  return page;
}

/**
 * ソート値を検証し、許可リストに含まれているかチェック
 * 
 * @param sort - ソート値
 * @param type - アイテムタイプ（'items' | 'actress'）
 * @returns 有効なソート値、またはデフォルト値
 */
export function validateSort(
  sort: string | null | undefined,
  type: 'items' | 'actress' = 'items'
): string {
  const allowed = ALLOWED_SORT_VALUES[type];
  // 型安全なチェック
  if (!sort || !(allowed as readonly string[]).includes(sort)) {
    return type === 'items' ? 'rank' : 'rank';
  }
  return sort;
}

/**
 * ページが2ページ目以降かどうかを判定
 * 
 * @param page - ページ番号
 * @returns 2ページ目以降の場合true
 */
export function isSecondaryPage(page: number): boolean {
  return page > 1;
}

/**
 * Canonical URLを生成
 * 
 * @param basePath - ベースパス（例: '/', '/actress/123'）
 * @param page - ページ番号
 * @param sort - ソート値またはtype（rankings用）
 * @returns Canonical URL
 */
export function generateCanonicalUrl(
  basePath: string,
  page: number,
  sort?: string
): string {
  const baseUrl = 'https://www.avscope.jp';
  
  // 1ページ目でデフォルトソートの場合はクエリなし
  if (page === 1 && (!sort || sort === 'rank' || sort === 'popular')) {
    return `${baseUrl}${basePath}`;
  }
  
  // それ以外はクエリ付き
  const params = new URLSearchParams();
  if (page > 1) {
    params.set('page', page.toString());
  }
  if (sort && sort !== 'rank' && sort !== 'popular') {
    // rankingsの場合はtype、それ以外はsort
    if (basePath === '/rankings') {
      params.set('type', sort);
    } else {
      params.set('sort', sort);
    }
  }
  
  const query = params.toString();
  return query ? `${baseUrl}${basePath}?${query}` : `${baseUrl}${basePath}`;
}

/**
 * Robotsメタデータを生成
 * 
 * @param page - ページ番号
 * @returns Robotsメタデータ
 */
export function generateRobotsMeta(page: number): {
  index: boolean;
  follow: boolean;
} {
  // 2ページ目以降はnoindex, follow
  if (isSecondaryPage(page)) {
    return {
      index: false,
      follow: true,
    };
  }
  
  // 1ページ目はindex, follow
  return {
    index: true,
    follow: true,
  };
}

