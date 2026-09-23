'use client';

import Link from 'next/link';

/**
 * 広告の配置位置
 */
export type AdPlacement = 'sidebar' | 'content' | 'banner' | 'auto';

const PROMO_ARTICLE = {
  href: '/articles/fanza-tv-free-trial-guide-2026',
  badge: '完全無料',
  title: 'FANZA見放題を0円で楽しむ方法',
  description:
    'DMMプレミアムの無料体験でFANZA TVが完全無料。解約タイミングなど損しない手順を解説。',
  cta: '無料体験の手順を見る',
} as const;

interface RandomAdProps {
  /**
   * 広告をフィルタリングする条件
   */
  filter?: {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    type?: string;
  };

  /**
   * 特定のサイズの広告のみを表示
   */
  size?: {
    width: number;
    height: number;
    label?: string;
  };

  /**
   * 広告の配置位置
   * - sidebar: サイドバー用（PC向けの縦長広告）
   * - content: コンテンツ内（中サイズ）
   * - banner: バナー用（横長広告）
   * - auto: デバイスに応じて自動選択
   */
  placement?: AdPlacement;

  /**
   * デバイス検出を無効化（常に指定されたfilterを使用）
   */
  disableDeviceDetection?: boolean;

  /**
   * カスタムクラス名
   */
  className?: string;

  /**
   * 広告を再選択する間隔（秒）
   * 指定しない場合は、マウント時に一度だけ選択
   */
  refreshInterval?: number;

  /**
   * 広告が見つからない場合のフォールバックコンテンツ
   */
  fallback?: React.ReactNode;
}

export default function RandomAd({
  placement = 'auto',
  className = '',
}: RandomAdProps) {
  const baseCardClass =
    'w-full rounded-lg border border-[#333333] bg-[#1a1a1a] transition-colors hover:border-[#444444] hover:bg-[#202020]';

  const badgeClass =
    'inline-flex items-center rounded border border-red-600/50 bg-red-950/40 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-red-300';

  if (placement === 'sidebar') {
    return (
      <Link
        href={PROMO_ARTICLE.href}
        className={`block ${className}`}
        aria-label={`${PROMO_ARTICLE.title}の記事へ`}
      >
        <div className={`${baseCardClass} overflow-hidden`}>
          <div className="p-4">
            <span className={badgeClass}>{PROMO_ARTICLE.badge}</span>
            <h3 className="mt-3 text-base font-bold leading-snug text-gray-100">
              {PROMO_ARTICLE.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              {PROMO_ARTICLE.description}
            </p>
            <div className="mt-4 rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-700">
              {PROMO_ARTICLE.cta}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (placement === 'banner') {
    return (
      <Link
        href={PROMO_ARTICLE.href}
        className={`block ${className}`}
        aria-label={`${PROMO_ARTICLE.title}の記事へ`}
      >
        <div className={`${baseCardClass} overflow-hidden p-4 sm:p-5`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <span className={badgeClass}>{PROMO_ARTICLE.badge}</span>
              <h3 className="mt-2 text-base font-bold text-gray-100 sm:text-lg">
                {PROMO_ARTICLE.title}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                {PROMO_ARTICLE.description}
              </p>
            </div>
            <div className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-red-700 sm:self-center">
              {PROMO_ARTICLE.cta}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={PROMO_ARTICLE.href}
      className={`block ${className}`}
      aria-label={`${PROMO_ARTICLE.title}の記事へ`}
    >
      <div className={`${baseCardClass} p-4`}>
        <span className={badgeClass}>{PROMO_ARTICLE.badge}</span>
        <h3 className="mt-2 text-base font-bold text-gray-100">{PROMO_ARTICLE.title}</h3>
        <p className="mt-1 text-sm text-gray-400">{PROMO_ARTICLE.description}</p>
      </div>
    </Link>
  );
}
