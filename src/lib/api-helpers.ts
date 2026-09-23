/**
 * APIルート共通ヘルパー
 * 
 * @description
 * APIルートで使用する共通のエラーハンドリング、認証チェック、キャッシュ設定などを提供
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getApiCredentials,
  createCredentialsError,
  createDmmApiError,
} from '@/lib/api-config';

// ============================================
// 型定義
// ============================================

export interface CacheOptions {
  revalidate?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
}

export interface ApiHandlerOptions {
  requireAuth?: boolean;
  cache?: CacheOptions | false;
  onError?: (error: unknown) => void;
}

// ============================================
// 共通ヘルパー関数
// ============================================

/**
 * 認証情報を検証
 * 
 * @returns 認証情報、またはnull（認証エラーの場合）
 */
export function validateApiCredentials(): ReturnType<typeof getApiCredentials> {
  const credentials = getApiCredentials();
  if (!credentials) {
    return null;
  }
  return credentials;
}

/**
 * キャッシュ付きレスポンスを生成
 * 
 * @param data - レスポンスデータ
 * @param options - キャッシュオプション
 * @returns NextResponse
 */
export function createCachedResponse(
  data: unknown,
  options?: CacheOptions
): NextResponse {
  const headers: HeadersInit = {};

  if (options) {
    // デフォルトは24時間（86400秒）
    const defaultCache = 60 * 60 * 24;
    const sMaxAge = options.sMaxAge ?? defaultCache;
    const staleWhileRevalidate = options.staleWhileRevalidate ?? sMaxAge * 2;
    
    headers['Cache-Control'] = `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`;
  } else {
    headers['Cache-Control'] = 'no-store';
  }

  return NextResponse.json(data, { headers });
}

/**
 * エラーレスポンスを生成
 * 
 * @param error - エラーオブジェクト
 * @param context - エラーコンテキスト（API名など）
 * @returns NextResponse
 */
export function createErrorResponse(
  error: unknown,
  context?: string
): NextResponse {
  console.error(`${context || 'API'} Error:`, error);

  // バリデーションエラーの場合（ApiError型をチェック）
  if (error && typeof error === 'object' && 'error' in error && 'status' in error) {
    const apiError = error as { error: string; status: number };
    // 400番台のエラーはバリデーションエラー
    if (apiError.status >= 400 && apiError.status < 500) {
      return NextResponse.json(apiError, {
        status: apiError.status,
        headers: { 'Cache-Control': 'no-store' },
      });
    }
  }

  // 認証エラーの場合
  if (error instanceof Error && error.message.includes('credentials')) {
    const credentialsError = createCredentialsError();
    return NextResponse.json(credentialsError, {
      status: credentialsError.status,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 404エラーの場合（Item not foundなど）
  if (error instanceof Error && error.message.includes('not found')) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 404,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  // DMM APIエラーの場合
  const apiError = createDmmApiError(context || 'API');
  return NextResponse.json(apiError, {
    status: apiError.status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

/**
 * APIハンドラーをラップしてエラーハンドリングと認証チェックを追加
 * 
 * @param handler - APIハンドラー関数
 * @param options - オプション
 * @returns ラップされたハンドラー
 */
export function withApiErrorHandling<T = unknown>(
  handler: (request: NextRequest, credentials: NonNullable<ReturnType<typeof getApiCredentials>>) => Promise<T>,
  options: ApiHandlerOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 認証チェック
      if (options.requireAuth !== false) {
        const credentials = validateApiCredentials();
        if (!credentials) {
          const error = createCredentialsError();
          return NextResponse.json(error, {
            status: error.status,
            headers: { 'Cache-Control': 'no-store' },
          });
        }

        // ハンドラーを実行
        const data = await handler(request, credentials);

        // キャッシュ付きレスポンスを返す
        if (options.cache !== false) {
          return createCachedResponse(data, options.cache);
        }

        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'no-store' },
        });
      } else {
        // 認証不要の場合（型アサーションを使用）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await handler(request, null as any);

        if (options.cache !== false) {
          return createCachedResponse(data, options.cache);
        }

        return NextResponse.json(data, {
          headers: { 'Cache-Control': 'no-store' },
        });
      }
    } catch (error) {
      if (options.onError) {
        options.onError(error);
      }

      return createErrorResponse(error, options.requireAuth !== false ? 'API' : undefined);
    }
  };
}

/**
 * クエリパラメータをパース
 * 
 * @param request - NextRequest
 * @param defaults - デフォルト値
 * @returns パースされたパラメータ
 */
export function parseQueryParams<T extends Record<string, string | number | undefined>>(
  request: NextRequest,
  defaults: T = {} as T
): Record<string, string> {
  const searchParams = request.nextUrl.searchParams;
  const params: Record<string, string> = {};

  Object.keys(defaults).forEach((key) => {
    const value = searchParams.get(key);
    params[key] = value || (defaults[key]?.toString() || '');
  });

  // デフォルトにないパラメータも取得
  searchParams.forEach((value, key) => {
    if (!(key in params)) {
      params[key] = value;
    }
  });

  return params;
}

