/**
 * ローディングコンポーネント
 */

// ============================================
// 型定義
// ============================================

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

// ============================================
// コンポーネント
// ============================================

/**
 * スピナー付きローディング
 */
export function LoadingSpinner({ size = 'md', message }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div
        className={`${sizeClasses[size]} border-4 border-gray-600 border-t-red-600 rounded-full animate-spin`}
        role="status"
        aria-label="読み込み中"
      />
      {message && <p className="text-gray-400 text-sm">{message}</p>}
    </div>
  );
}

/**
 * スケルトンローディング（カード用）
 */
export function LoadingSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden">
          <div className="aspect-[3/2] bg-[#252525] animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-[#252525] rounded animate-pulse" />
            <div className="h-3 bg-[#252525] rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-[#252525] rounded w-1/2 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * シンプルなテキストローディング
 */
export function LoadingText({ message = '読み込み中...' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-400">{message}</p>
    </div>
  );
}

