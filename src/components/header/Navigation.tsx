/**
 * ナビゲーションコンポーネント
 *
 * @description
 * ヘッダーのナビゲーションリンクを表示するコンポーネント
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import Link from '@/components/ui/Link';
import { ADVERTISE_PAGE_PATH } from '@/config/advertise';
import { SIBLING_SITES } from '@/config/sibling-sites';
import { SURVEY_FORM_URL, SURVEY_NAV_LABEL } from '@/config/survey';

interface NavigationProps {
  onLinkClick?: () => void;
  variant?: 'desktop' | 'mobile';
}

const NAV_ITEMS = [
  { href: '/duga', label: 'DUGA' },
  { href: '/articles', label: '特集記事' },
  { href: '/rankings', label: 'ランキング' },
  { href: '/actresses', label: '女優検索' },
  { href: '/genre', label: 'ジャンル検索' },
  { href: ADVERTISE_PAGE_PATH, label: '広告主募集' },
] as const;

const SIBLING_MENU_LABEL = '▼検索系おすすめサイト';

export default function Navigation({ onLinkClick, variant = 'desktop' }: NavigationProps) {
  const isDesktop = variant === 'desktop';
  const [isSiblingMenuOpen, setIsSiblingMenuOpen] = useState(false);
  const siblingMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSiblingMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        siblingMenuRef.current &&
        !siblingMenuRef.current.contains(event.target as Node)
      ) {
        setIsSiblingMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSiblingMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isSiblingMenuOpen]);

  const linkClassName = isDesktop
    ? 'text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap'
    : 'flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-[#252525] transition-colors';

  const handleSiblingLinkClick = () => {
    setIsSiblingMenuOpen(false);
    onLinkClick?.();
  };

  return (
    <nav className={isDesktop ? 'flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5' : 'py-2'}>
      {NAV_ITEMS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          onClick={onLinkClick}
          className={linkClassName}
        >
          <span className={!isDesktop ? 'font-medium' : ''}>{label}</span>
        </Link>
      ))}

      <a
        href={SURVEY_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        title="改善アンケート（抽選でAmazonギフト券1,000円分）"
        onClick={onLinkClick}
        className={linkClassName}
      >
        <span className={!isDesktop ? 'font-medium' : ''}>{SURVEY_NAV_LABEL}</span>
      </a>

      <div ref={siblingMenuRef} className={isDesktop ? 'relative shrink-0' : ''}>
        <button
          type="button"
          onClick={() => setIsSiblingMenuOpen((open) => !open)}
          className={
            isDesktop
              ? linkClassName
              : `${linkClassName} w-full text-left`
          }
          aria-expanded={isSiblingMenuOpen}
          aria-haspopup="true"
        >
          <span className={!isDesktop ? 'font-medium' : ''}>{SIBLING_MENU_LABEL}</span>
        </button>

        {isSiblingMenuOpen && (
          <div
            className={
              isDesktop
                ? 'absolute top-full left-0 mt-2 min-w-[14rem] rounded-md border border-[#333333] bg-[#1a1a1a] py-1 shadow-lg z-50'
                : 'border-t border-[#333333] bg-[#151515]'
            }
          >
            {SIBLING_SITES.map(({ href, label, description }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleSiblingLinkClick}
                className={
                  isDesktop
                    ? 'block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#252525] transition-colors whitespace-nowrap'
                    : 'flex flex-col px-8 py-3 text-gray-300 hover:text-white hover:bg-[#252525] transition-colors'
                }
                title={description}
              >
                <span className={!isDesktop ? 'font-medium' : ''}>{label}</span>
                {!isDesktop && (
                  <span className="mt-0.5 text-xs text-gray-500">{description}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
