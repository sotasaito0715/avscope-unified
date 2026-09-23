'use client';

import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';
import { getActressHref } from '@/lib/catalog';

interface ItemDetailActressSectionProps {
  item: DMMItem;
}

export default function ItemDetailActressSection({ item }: ItemDetailActressSectionProps) {
  if (!item.iteminfo?.actress || item.iteminfo.actress.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 border-b border-[#333333] pb-2 mb-4">
        出演者 ({item.iteminfo.actress.length}名)
      </h2>
      <div className="flex flex-wrap gap-3" role="list">
        {item.iteminfo.actress.map((actress, index) => {
          const href = getActressHref(item, actress.id);
          const className = 'inline-block px-4 py-2 bg-[#252525] text-blue-400 rounded-full text-sm border border-[#333333]';
          if (!href) {
            return (
              <span
                key={`${actress.id}-${index}`}
                className={`${className} text-gray-200`}
                itemProp="actor"
                itemScope
                itemType="https://schema.org/Person"
                role="listitem"
              >
                <span itemProp="name">{actress.name}</span>
              </span>
            );
          }
          return (
            <Link
              key={`${actress.id}-${index}`}
              href={href}
              className={`${className} hover:bg-[#333333] hover:text-blue-300 transition-colors`}
              itemProp="actor"
              itemScope
              itemType="https://schema.org/Person"
              role="listitem"
            >
              <span itemProp="name">{actress.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
