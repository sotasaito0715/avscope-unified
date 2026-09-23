/**
 * ログユーティリティ
 * 
 * @description
 * 本番環境ではログを出力しないようにするためのユーティリティ関数。
 * 開発環境でのみログを出力します。
 */

/**
 * ログユーティリティ
 * 
 * @description
 * 本番環境ではログを出力しないようにするためのユーティリティ関数。
 * 開発環境でのみログを出力します。
 */

/**
 * 通常のログを出力（開発環境のみ）
 */
export const log = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

/**
 * エラーログを出力（開発環境のみ）
 */
export const logError = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(...args);
  }
};

/**
 * 警告ログを出力（開発環境のみ）
 */
export const logWarn = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};

/**
 * 情報ログを出力（開発環境のみ）
 */
export const logInfo = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.info(...args);
  }
};

/**
 * デバッグログを出力（開発環境のみ）
 */
export const logDebug = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug(...args);
  }
};

