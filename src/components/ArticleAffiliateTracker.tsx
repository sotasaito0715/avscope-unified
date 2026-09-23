'use client';

import { useCallback, type ReactNode, type MouseEvent } from 'react';
import { trackAffiliateClick } from '@/lib/analytics';

function isAffiliateUrl(href: string): boolean {
  try {
    const url = new URL(href, 'https://www.avscope.jp');
    const host = url.hostname.toLowerCase();
    return (
      host === 'al.dmm.co.jp' ||
      host.endsWith('.dmm.co.jp') ||
      host.endsWith('.dmm.com') ||
      host.endsWith('.fanza.com') ||
      host.includes('affiliate.dmm')
    );
  } catch {
    return false;
  }
}

function extractContentId(href: string): string | undefined {
  try {
    const url = new URL(href, 'https://www.avscope.jp');
    const candidates = [
      url.searchParams.get('cid'),
      url.searchParams.get('content_id'),
      url.searchParams.get('id'),
      url.pathname.match(/\/(?:content|item)\/([^/?#]+)/i)?.[1],
    ];
    return candidates.find((value): value is string => Boolean(value)) || undefined;
  } catch {
    return undefined;
  }
}

interface ArticleAffiliateTrackerProps {
  children: ReactNode;
}

/**
 * 記事内の外部アフィリエイトリンククリックを GA に送る（イベント委譲）。
 * Server Component の Markdown 出力をラップするだけで動作する。
 */
export default function ArticleAffiliateTracker({ children }: ArticleAffiliateTrackerProps) {
  const handleClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const anchor = target?.closest?.('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('/') || href.startsWith('#')) return;
    if (!isAffiliateUrl(href)) return;

    trackAffiliateClick({
      item_id: extractContentId(href) || href,
      item_title: (anchor.textContent || '').trim().slice(0, 120) || undefined,
      page_type: 'article',
      link_type: 'banner',
    });
  }, []);

  return (
    <div onClick={handleClick} data-affiliate-tracker="article">
      {children}
    </div>
  );
}
