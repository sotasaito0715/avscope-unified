'use client';

import { useState } from 'react';
import { ItemFilters, DEFAULT_FILTERS } from '@/types/filters';
import { countActiveFilters } from '@/lib/filter-utils';

interface DetailedFiltersProps {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
  onReset?: () => void;
}

export default function DetailedFilters({ filters, onChange, onReset }: DetailedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ItemFilters>(filters);

  const activeCount = countActiveFilters(localFilters);

  const handleInputChange = (key: keyof ItemFilters, value: string | number | undefined) => {
    const newFilters = { ...localFilters, [key]: value === '' ? undefined : value };
    setLocalFilters(newFilters);
  };

  const handleApply = () => {
    onChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    setIsOpen(false);
    onReset?.();
  };

  // 今日の日付をYYYY-MM-DD形式で取得
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#252525] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
        </svg>
        <span>詳細フィルター</span>
        {activeCount > 0 && (
          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 bg-[#1a1a1a] rounded-lg p-6 border border-[#333]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 価格フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">価格帯（円）</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="最低価格"
                  value={localFilters.minPrice || ''}
                  onChange={(e) => handleInputChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                  min="0"
                />
                <span className="text-gray-400 self-center">〜</span>
                <input
                  type="number"
                  placeholder="最高価格"
                  value={localFilters.maxPrice || ''}
                  onChange={(e) => handleInputChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                  min="0"
                />
              </div>
            </div>

            {/* 発売日フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">発売日範囲</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={localFilters.startDate || ''}
                  onChange={(e) => handleInputChange('startDate', e.target.value || undefined)}
                  max={today}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                />
                <span className="text-gray-400 self-center">〜</span>
                <input
                  type="date"
                  value={localFilters.endDate || ''}
                  onChange={(e) => handleInputChange('endDate', e.target.value || undefined)}
                  max={today}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                />
              </div>
            </div>

            {/* 評価フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">最低評価</label>
              <input
                type="number"
                placeholder="0.0"
                value={localFilters.minRating || ''}
                onChange={(e) => handleInputChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            {/* 収録時間フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">最低収録時間（分）</label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.minDuration || ''}
                onChange={(e) => handleInputChange('minDuration', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                min="0"
              />
            </div>

            {/* 出演人数フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">出演人数</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  value={localFilters.minActressCount || ''}
                  onChange={(e) => handleInputChange('minActressCount', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                  min="0"
                />
                <span className="text-gray-400 self-center">〜</span>
                <input
                  type="number"
                  placeholder="最大"
                  value={localFilters.maxActressCount || ''}
                  onChange={(e) => handleInputChange('maxActressCount', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#333] rounded text-gray-100 text-sm"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              適用
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              リセット
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

