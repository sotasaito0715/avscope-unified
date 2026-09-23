/**
 * DUGA API設定とユーティリティ
 */

// ============================================
// 型定義
// ============================================

export interface ApiCredentials {
  appId: string;
  agentId: string;
  bannerId: string;
  version: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

// ============================================
// アプリケーション ID（最大5件・ラウンドロビン）
// ============================================

let roundRobinIndex = 0;

/**
 * 環境変数から DUGA アプリケーション ID 一覧を取得
 *
 * 優先順位:
 * 1. DUGA_APP_IDS（カンマ区切り）
 * 2. DUGA_APP_ID_1 〜 DUGA_APP_ID_5
 * 3. DUGA_APP_ID（単一・後方互換）
 */
export function parseDugaAppIds(): string[] {
  const appIdsEnv = process.env.DUGA_APP_IDS;
  if (appIdsEnv) {
    const ids = appIdsEnv
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (ids.length > 0) {
      return ids.slice(0, 5);
    }
  }

  const numberedIds = [1, 2, 3, 4, 5]
    .map((index) => process.env[`DUGA_APP_ID_${index}`]?.trim())
    .filter((id): id is string => Boolean(id));

  if (numberedIds.length > 0) {
    return numberedIds;
  }

  const legacyAppId = process.env.DUGA_APP_ID?.trim();
  if (legacyAppId) {
    return [legacyAppId];
  }

  return [];
}

/**
 * 次に使用するアプリケーション ID をラウンドロビンで返す
 */
export function getNextAppId(): string | null {
  const appIds = parseDugaAppIds();
  if (appIds.length === 0) {
    return null;
  }

  const appId = appIds[roundRobinIndex % appIds.length];
  roundRobinIndex = (roundRobinIndex + 1) % appIds.length;
  return appId;
}

/**
 * DUGA API 認証情報が設定されているか（ラウンドロビンカウンタは進めない）
 */
export function hasApiCredentials(): boolean {
  return parseDugaAppIds().length > 0 && Boolean(process.env.DUGA_AGENT_ID?.trim());
}

/**
 * DUGA API 認証情報を取得（appid はラウンドロビン）
 */
export function getApiCredentials(): ApiCredentials | null {
  const appId = getNextAppId();
  const agentId = process.env.DUGA_AGENT_ID?.trim();

  if (!appId || !agentId) {
    return null;
  }

  return {
    appId,
    agentId,
    bannerId: process.env.DUGA_BANNER_ID || '01',
    version: process.env.DUGA_API_VERSION || '1.2',
  };
}

/**
 * APIリクエストのデフォルトヘッダーを取得
 */
export function getApiHeaders(): HeadersInit {
  return {
    'User-Agent': 'AV-Scope-DUGA/1.0',
    'Accept': 'application/json',
  };
}

// ============================================
// URL構築
// ============================================

/**
 * DUGA Search APIのURLを構築
 */
export function buildDugaSearchUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `http://affapi.duga.jp/search?${searchParams.toString()}`;
}

// 後方互換エイリアス
export const buildItemListUrl = buildDugaSearchUrl;

// ============================================
// パラメータ構築
// ============================================

/**
 * 空の値を除外してパラメータオブジェクトを構築
 */
export function buildParams(params: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  });

  return result;
}

/**
 * 基本的なAPI認証パラメータを取得
 */
export function getBaseApiParams(credentials: ApiCredentials): Record<string, string> {
  return {
    version: credentials.version,
    appid: credentials.appId,
    agentid: credentials.agentId,
    bannerid: credentials.bannerId,
    format: 'json',
    adult: '1',
  };
}

/**
 * Search API用の基本パラメータを取得
 */
export function getItemListBaseParams(credentials: ApiCredentials): Record<string, string> {
  return getBaseApiParams(credentials);
}

// ============================================
// エラーハンドリング
// ============================================

/**
 * APIエラーメッセージを生成
 */
export function createApiError(message: string, status?: number): ApiError {
  return { error: message, status };
}

/**
 * 認証エラーレスポンスを生成
 */
export function createCredentialsError(): ApiError {
  return createApiError('API credentials not configured', 500);
}

/**
 * バリデーションエラーレスポンスを生成
 */
export function createValidationError(message: string): ApiError {
  return createApiError(message, 400);
}

/**
 * 外部APIエラーレスポンスを生成
 */
export function createDmmApiError(source: string): ApiError {
  return createApiError(`Failed to fetch from DUGA ${source} API`, 500);
}

/**
 * 女優検索用 URL 構築（後方互換）
 */
export function buildActressSearchUrl(params: Record<string, string>): string {
  return buildDugaSearchUrl(params);
}
