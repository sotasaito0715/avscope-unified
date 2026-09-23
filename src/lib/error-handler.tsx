/**
 * 統一されたエラーハンドリングユーティリティ
 * 
 * @description
 * アプリケーション全体で一貫したエラーハンドリングを提供。
 * APIエラー、ネットワークエラー、バリデーションエラーを統一的に処理。
 */

import React from 'react';
import { ApiError } from '@/types';

// ============================================
// エラータイプ定義
// ============================================

export class NetworkError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}


export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// ============================================
// エラーハンドラークラス
// ============================================

export class ErrorHandler {
  /**
   * APIエラーの処理
   */
  static handleApiError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error && typeof error === 'object' && 'response' in error) {
      // HTTPエラーレスポンス
      const response = (error as { response: { status: number; data?: { message?: string; code?: string } } }).response;
      const status = response.status;
      const message = response.data?.message || (error as { message?: string }).message || 'API request failed';
      return new ApiError(message, status, response.data?.code);
    }

    if (error && typeof error === 'object' && 'request' in error) {
      // ネットワークエラー
      return new NetworkError('Network request failed', 0);
    }

    // その他のエラー
    const message = (error as { message?: string }).message || 'Unknown API error';
    return new ApiError(message);
  }

  /**
   * ネットワークエラーの処理
   */
  static handleNetworkError(error: unknown): NetworkError {
    if (error instanceof NetworkError) {
      return error;
    }

    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'NETWORK_ERROR') {
      return new NetworkError('Network connection failed');
    }

    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: string }).message === 'string' && (error as { message: string }).message.includes('network')) {
      return new NetworkError('Network connection failed');
    }

    const message = (error as { message?: string }).message || 'Network error';
    return new NetworkError(message);
  }

  /**
   * バリデーションエラーの処理
   */
  static handleValidationError(error: unknown, field?: string): ValidationError {
    if (error instanceof ValidationError) {
      return error;
    }

    const message = (error as { message?: string }).message || 'Validation failed';
    return new ValidationError(message, field);
  }

  /**
   * タイムアウトエラーの処理
   */
  static handleTimeoutError(error: unknown): TimeoutError {
    if (error instanceof TimeoutError) {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: string }).message === 'string' && (error as { message: string }).message.includes('timeout')) {
      return new TimeoutError();
    }

    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'TIMEOUT') {
      return new TimeoutError();
    }

    const message = (error as { message?: string }).message;
    return new TimeoutError(message);
  }

  /**
   * 汎用エラーの処理
   */
  static handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }

    if (typeof error === 'string') {
      return new Error(error);
    }

    return new Error('Unknown error occurred');
  }

  /**
   * エラーメッセージの取得
   */
  static getErrorMessage(error: Error): string {
    if (error instanceof NetworkError) {
      return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
    }

    if (error instanceof ValidationError) {
      return `入力内容に問題があります: ${error.message}`;
    }

    if (error instanceof ApiError) {
      switch (error.status) {
        case 400:
          return 'リクエストが正しくありません。';
        case 401:
          return '認証が必要です。';
        case 403:
          return 'アクセスが拒否されました。';
        case 404:
          return 'リソースが見つかりません。';
        case 429:
          return 'リクエストが多すぎます。しばらく待ってから再試行してください。';
        case 500:
          return 'サーバーエラーが発生しました。';
        case 502:
        case 503:
        case 504:
          return 'サーバーが一時的に利用できません。';
        default:
          return `APIエラーが発生しました: ${error.message}`;
      }
    }

    if (error instanceof TimeoutError) {
      return 'リクエストがタイムアウトしました。しばらく待ってから再試行してください。';
    }

    return error.message || '予期しないエラーが発生しました。';
  }

  /**
   * エラーのログ出力
   */
  static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    
    console.error(`❌ ${contextStr} Error at ${timestamp}:`, {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
  }

  /**
   * エラーの通知（将来的に外部サービス連携用）
   */
  static notifyError(error: Error, context?: string): void {
    // 将来的にSentry、LogRocket等の外部サービスと連携
    this.logError(error, context);
  }
}

// ============================================
// エラーハンドリングHOC
// ============================================

export function withErrorHandling<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>
) {
  return function ErrorHandledComponent(props: T) {
    const handleError = (error: Error) => {
      ErrorHandler.logError(error, Component.name);
      ErrorHandler.notifyError(error, Component.name);
    };

    try {
      return <Component {...props} onError={handleError} />;
    } catch (error) {
      handleError(error as Error);
      return null;
    }
  };
}

// ============================================
// エラーバウンダリ
// ============================================

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    ErrorHandler.logError(error, 'ErrorBoundary');
    ErrorHandler.notifyError(error, 'ErrorBoundary');
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-100 mb-4">
            エラーが発生しました
          </h2>
          <p className="text-gray-400 mb-4">
            {ErrorHandler.getErrorMessage(this.state.error!)}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ページを再読み込み
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
