/**
 * 日付フォーマットユーティリティ
 */

/**
 * 日付文字列をフォーマット
 * @param dateString - 日付文字列
 * @param format - フォーマット形式（'long' | 'short'）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(dateString: string, format: 'long' | 'short' = 'long'): string {
  try {
    const date = new Date(dateString);
    
    if (format === 'long') {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  } catch {
    return dateString;
  }
}






