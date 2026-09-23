/**
 * 価格正規化ユーティリティ
 * 
 * @description
 * DMMのAPIから取得した価格文字列を構造化データ用に正規化します。
 * 余計な記号（~、円、カンマなど）を除去し、有効な数値文字列に変換します。
 */

/**
 * 価格文字列を正規化して数値文字列に変換
 * 
 * @param priceString - 元の価格文字列（例: "300~", "2180~", "1,500円", "2,000-3,000"）
 * @returns 正規化された数値文字列（例: "300", "2180", "1500", "2000"）
 */
export function normalizePrice(priceString: string | undefined): string {
  if (!priceString) return "0";
  
  // DMMの価格形式に対応した正規化
  // "300~" → "300", "1,500円" → "1500", "2,000-3,000" → "2000"
  const cleanPrice = priceString
    .replace(/[^\d]/g, '') // 数字以外を全て除去（~、円、カンマ、ハイフンなど）
    .trim(); // 前後の空白を除去
  
  // 空文字列の場合は0を返す
  if (!cleanPrice) return "0";
  
  // 数値として解析
  const numericPrice = parseInt(cleanPrice, 10);
  
  // 有効な数値かチェック
  if (isNaN(numericPrice) || numericPrice < 0) {
    return "0";
  }
  
  // 整数文字列として返す
  return numericPrice.toString();
}

/**
 * 価格文字列を数値に変換（コンポーネント用）
 * 
 * @param priceString - 元の価格文字列
 * @returns 正規化された数値、またはundefined
 */
export function normalizePriceToNumber(priceString: string | undefined): number | undefined {
  if (!priceString) return undefined;
  
  const normalizedPrice = normalizePrice(priceString);
  const numericPrice = parseInt(normalizedPrice);
  
  return isNaN(numericPrice) ? undefined : numericPrice;
}

/**
 * 価格範囲文字列を正規化（例: "1,000-2,000" → "1000"）
 * 
 * @param priceRangeString - 価格範囲文字列
 * @returns 最小価格の正規化された数値文字列
 */
export function normalizePriceRange(priceRangeString: string | undefined): string {
  if (!priceRangeString) return "0";
  
  // 範囲文字列から最小値を抽出
  const rangeMatch = priceRangeString.match(/(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    return normalizePrice(rangeMatch[1]);
  }
  
  return normalizePrice(priceRangeString);
}

/**
 * 価格の妥当性をチェック
 * 
 * @param priceString - 価格文字列
 * @returns 有効な価格かどうか
 */
export function isValidPrice(priceString: string | undefined): boolean {
  if (!priceString) return false;
  
  const normalizedPrice = normalizePrice(priceString);
  const numericPrice = parseFloat(normalizedPrice);
  
  return !isNaN(numericPrice) && numericPrice > 0;
}

/**
 * 価格表示用の文字列を生成
 * 
 * @param priceString - 元の価格文字列
 * @param currency - 通貨記号（デフォルト: "円"）
 * @returns 表示用の価格文字列
 */
export function formatPriceForDisplay(priceString: string | undefined, currency: string = "円"): string {
  if (!priceString) return "価格未定";
  
  const normalizedPrice = normalizePrice(priceString);
  const numericPrice = parseInt(normalizedPrice);
  
  if (isNaN(numericPrice) || numericPrice <= 0) {
    return "価格未定";
  }
  
  // 3桁区切りでフォーマット
  return numericPrice.toLocaleString() + currency;
}

/**
 * DMMの価格形式を表示用にフォーマット
 * 
 * @param priceString - DMMの価格文字列（例: "300~", "1,500円"）
 * @returns 表示用の価格文字列（例: "300円", "1,500円"）
 */
export function formatDMMPrice(priceString: string | undefined): string {
  if (!priceString) return "価格未定";
  
  // 元の価格文字列が"~"で終わる場合は、そのまま表示
  if (priceString.endsWith('~')) {
    const basePrice = normalizePrice(priceString);
    if (basePrice !== "0") {
      return basePrice + "円~";
    }
  }
  
  // 通常の価格表示
  return formatPriceForDisplay(priceString);
}
