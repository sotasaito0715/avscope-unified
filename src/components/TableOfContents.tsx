/**
 * 目次コンポーネント
 *
 * @description
 * 記事の見出しから自動生成される目次を表示するコンポーネント。
 * SEO向上のため、構造化された目次を提供します。
 */

'use client';

import React from 'react';
import { TableOfContentsItem } from '@/lib/markdown-utils';

interface TableOfContentsProps {
  items: TableOfContentsItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  if (!items || items.length === 0) {
    return null;
  }

  // 最初の見出しがh2以下の場合のみ表示（h1は通常タイトルなので除外）
  const displayItems = items.filter(item => item.level >= 2);

  if (displayItems.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // ヘッダーの高さ分のオフセット
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });

      // URLを更新（履歴に追加しない）
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <nav
      className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 mb-8"
      aria-label="目次"
    >
      <h2 className="text-xl font-bold text-gray-100 mb-4">目次</h2>
      <ul className="space-y-2">
        {displayItems.map((item, index) => {
          const indentClass = item.level === 2 
            ? 'ml-0' 
            : item.level === 3 
            ? 'ml-4' 
            : item.level === 4 
            ? 'ml-8' 
            : item.level === 5 
            ? 'ml-12' 
            : 'ml-16';

          return (
            <li key={`${item.id}-${index}`} className={indentClass}>
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className="text-gray-300 hover:text-gray-100 transition-colors text-sm block py-1"
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}






