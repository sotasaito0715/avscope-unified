'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { CatalogTab } from '@/lib/catalog';

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'all', label: 'すべて' },
  { id: 'fanza', label: 'FANZA' },
  { id: 'duga', label: 'DUGA' },
];

interface CatalogTabsProps {
  current: CatalogTab;
  fanzaCount?: number;
  dugaCount?: number;
}

export default function CatalogTabs({ current, fanzaCount, dugaCount }: CatalogTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = useCallback(
    (tab: CatalogTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('src', tab);
      params.set('page', '1');
      router.push(`/search?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-2 mb-6" role="tablist" aria-label="カタログ">
      {TABS.map((tab) => {
        const isActive = current === tab.id;
        const count =
          tab.id === 'fanza' ? fanzaCount : tab.id === 'duga' ? dugaCount : undefined;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleSelect(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-[#1a1a1a] text-gray-300 border-[#333333] hover:bg-[#252525]'
            }`}
          >
            {tab.label}
            {typeof count === 'number' && (
              <span className="ml-1.5 text-xs opacity-80">{count.toLocaleString()}件</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
