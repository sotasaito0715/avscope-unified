/**
 * 空状態表示コンポーネント
 */

import Link from '@/components/ui/Link';

// ============================================
// 型定義
// ============================================

type HeadingTag = 'h1' | 'h2' | 'h3';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  headingAs?: HeadingTag;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

// ============================================
// コンポーネント
// ============================================

/**
 * 空状態表示
 */
export default function EmptyState({ icon, title, description, action, headingAs = 'h3' }: EmptyStateProps) {
  const Heading = headingAs;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* アイコン */}
      {icon && (
        <div className="mb-6 text-6xl opacity-50" aria-hidden="true">
          {icon}
        </div>
      )}

      {/* タイトル */}
      <Heading className="text-xl font-bold text-gray-100 mb-2">{title}</Heading>

      {/* 説明 */}
      {description && <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>}

      {/* アクション */}
      {action && (
        <>
          {action.href ? (
            <Link
              href={action.href}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {action.label}
            </Link>
          ) : action.onClick ? (
            <button
              onClick={action.onClick}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {action.label}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

/**
 * 検索結果なし状態
 */
export function NoSearchResults({ 
  query, 
  message,
  headingAs = 'h3',
}: { 
  query?: string;
  message?: string;
  headingAs?: HeadingTag;
}) {
  const title = message || (query ? `「${query}」に一致する結果がありません` : '該当する結果がありません');
  
  return (
    <EmptyState
      icon="🔍"
      title={title}
      description="別のキーワードで検索してみてください。"
      headingAs={headingAs}
      action={{
        label: 'トップページに戻る',
        href: '/',
      }}
    />
  );
}

/**
 * データなし状態
 */
export function NoData({ message = 'データが見つかりませんでした' }: { message?: string }) {
  return (
    <EmptyState
      icon="📭"
      title={message}
      description="後ほどもう一度お試しください。"
    />
  );
}

/**
 * エラー状態
 */
export function ErrorState({
  message = 'エラーが発生しました',
  onRetry,
  error,
}: {
  message?: string;
  onRetry?: () => void;
  error?: Error | unknown;
}) {
  // エラーオブジェクトが提供された場合は、統一されたエラーハンドリングを使用
  const displayMessage = error
    ? (() => {
        try {
          // ErrorHandlerを使用してエラーメッセージを取得
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { ErrorHandler } = require('@/lib/error-handler');
          return ErrorHandler.getErrorMessage(
            error instanceof Error ? error : new Error(String(error))
          );
        } catch {
          // ErrorHandlerが利用できない場合は、元のメッセージを使用
          return message;
        }
      })()
    : message;

  return (
    <EmptyState
      icon="⚠️"
      title={displayMessage}
      description="問題が解決しない場合は、後ほどもう一度お試しください。"
      action={
        onRetry
          ? {
              label: '再試行',
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

