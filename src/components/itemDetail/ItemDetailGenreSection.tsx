'use client';

import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';
import { getGenreHref } from '@/lib/catalog';

interface ItemDetailGenreSectionProps {
  item: DMMItem;
}

export default function ItemDetailGenreSection({ item }: ItemDetailGenreSectionProps) {
  if (!item.iteminfo?.genre || item.iteminfo.genre.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-bold text-gray-100 border-b border-[#333333] pb-2 mb-4">
        ジャンル
      </h2>
      <div className="flex flex-wrap gap-2" role="list">
        {item.iteminfo.genre.map((genre) => {
          const href = getGenreHref(item, genre.id);
          const className = 'px-3 py-1 bg-[#252525] text-blue-400 rounded-full text-sm border border-[#333333]';
          if (!href) {
            return (
              <span
                key={genre.id}
                className={`${className} text-gray-200`}
                itemProp="keywords"
                role="listitem"
              >
                {genre.name}
              </span>
            );
          }
          return (
          <Link
            key={genre.id}
            href={href}
            className={`${className} hover:bg-[#333333] hover:text-blue-300 transition-colors`}
            itemProp="keywords"
            role="listitem"
          >
            {genre.name}
          </Link>
          );
        })}
      </div>
    </section>
  );
}


