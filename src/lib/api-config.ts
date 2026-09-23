/**
 * DMM API設定とユーティリティ
 */

// ============================================
// 型定義
// ============================================

export interface ApiCredentials {
  apiId: string;
  affiliateId: string;
  site: string;
  service: string;
  floor: string;
}

export interface ApiError {
  error: string;
  status?: number;
}

// ============================================
// 設定取得
// ============================================

/**
 * DMM API認証情報を取得
 */
export function getApiCredentials(): ApiCredentials | null {
  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    return null;
  }

  return {
    apiId,
    affiliateId,
    site: process.env.DMM_SITE || 'FANZA',
    service: process.env.DMM_SERVICE || 'digital',
    floor: process.env.DMM_FLOOR || 'videoa',
  };
}

/**
 * APIリクエストのデフォルトヘッダーを取得
 */
export function getApiHeaders(): HeadersInit {
  return {
    'User-Agent': 'DMM-Affiliate-Search-App/1.0',
    'Accept': 'application/json',
  };
}

// ============================================
// URL構築
// ============================================

/**
 * DMM ItemList APIのURLを構築
 */
export function buildItemListUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `https://api.dmm.com/affiliate/v3/ItemList?${searchParams.toString()}`;
}

/**
 * DMM ActressSearch APIのURLを構築
 */
export function buildActressSearchUrl(params: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  return `https://api.dmm.com/affiliate/v3/ActressSearch?${searchParams.toString()}`;
}

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
    api_id: credentials.apiId,
    affiliate_id: credentials.affiliateId,
    output: 'json',
  };
}

/**
 * ItemList API用の基本パラメータを取得
 */
export function getItemListBaseParams(credentials: ApiCredentials): Record<string, string> {
  return {
    ...getBaseApiParams(credentials),
    site: credentials.site,
    service: credentials.service,
    // floor: credentials.floor, // 一時的に削除
  };
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
 * DMM APIエラーレスポンスを生成
 */
export function createDmmApiError(source: string): ApiError {
  return createApiError(`Failed to fetch from DMM ${source} API`, 500);
}

