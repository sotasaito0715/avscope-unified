'use client';

import { useRouter } from 'next/navigation';
import Link from '@/components/ui/Link';

interface RankingsTabsProps {
  currentType: string;
}

interface RankingType {
  id: string;
  label: string;
  icon: string;
  description: string;
}

const RANKING_TYPES: RankingType[] = [
  {
    id: 'popular',
    label: '人気ランキング',
    icon: '🔥',
    description: 'DMMで人気の作品',
  },
  {
    id: 'new',
    label: '新着ランキング',
    icon: '🆕',
    description: '最新の作品',
  },
  {
    id: 'price-low',
    label: '価格（安い順）',
    icon: '💸',
    description: '価格が安い順',
  },
  {
    id: 'price-high',
    label: '価格（高い順）',
    icon: '💰',
    description: '価格が高い順',
  },
  {
    id: 'rating',
    label: '評価ランキング',
    icon: '⭐',
    description: '評価が高い順',
  },
];

export default function RankingsTabs({ currentType }: RankingsTabsProps) {
  const router = useRouter();

  return (
    <div className="mb-6 border-b border-[#333]">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {RANKING_TYPES.map((type) => {
          const isActive = currentType === type.id;
          return (
            <Link
              key={type.id}
              href={`/rankings?type=${type.id}`}
              className={`
                px-4 py-3 text-sm font-medium rounded-t-lg transition-colors
                ${isActive
                  ? 'bg-[#1a1a1a] text-red-400 border-b-2 border-red-400'
                  : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                }
                flex items-center gap-2 whitespace-nowrap
              `}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/rankings?type=${type.id}`);
              }}
            >
              <span className="text-lg">{type.icon}</span>
              <span>{type.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

