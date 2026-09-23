'use client';

import { RangeSlider } from '@/components/ui/RangeSlider';
import { ACTRESS_FILTER_RANGES, SORT_OPTIONS } from '@/lib/constants';
import { FORM_STYLES, BUTTON_STYLES } from '@/lib/styles';
import { useActressSearch } from '@/hooks/useActressSearch';

// ============================================
// コンポーネント
// ============================================

/**
 * 女優検索フォームコンポーネント
 * 
 * @description
 * キーワード、サイズ（バスト・ウエスト・ヒップ）、身長、生年月日での
 * 女優検索フォームを提供します。
 * 
 * @param initialParams - 初期検索パラメータ（URLから取得）
 */
export default function ActressSearchForm({ initialParams }: { initialParams: Record<string, string> }) {
  const {
    filters,
    showAdvanced,
    setShowAdvanced,
    handleInputChange,
    handleSubmit,
    handleReset,
  } = useActressSearch({ initialParams });

  return (
    <form onSubmit={handleSubmit} className="bg-[#1a1a1a] rounded-lg p-6 mb-8">
      {/* キーワード検索 */}
      <div className="mb-6">
        <label htmlFor="keyword" className={FORM_STYLES.label.main}>
          キーワード
        </label>
        <input
          type="text"
          id="keyword"
          value={filters.keyword}
          onChange={(e) => handleInputChange('keyword', e.target.value)}
          placeholder="女優名を入力"
          className={FORM_STYLES.input}
        />
      </div>

      {/* 並び替え */}
      <div className="mb-6">
        <label htmlFor="sort" className={FORM_STYLES.label.main}>
          並び替え
        </label>
        <select
          id="sort"
          value={filters.sort}
          onChange={(e) => handleInputChange('sort', e.target.value)}
          className={FORM_STYLES.select}
        >
          {SORT_OPTIONS.actress.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* 詳細フィルター展開ボタン */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className={`${BUTTON_STYLES.textWithIcon} mb-4`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        詳細フィルター
      </button>

      {/* 詳細フィルター */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-[#0a0a0a] rounded-md">
          {/* バスト */}
          <RangeSlider
            label={ACTRESS_FILTER_RANGES.bust.label}
            fieldPrefix="bust"
            min={ACTRESS_FILTER_RANGES.bust.min}
            max={ACTRESS_FILTER_RANGES.bust.max}
            defaultMin={ACTRESS_FILTER_RANGES.bust.defaultMin}
            defaultMax={ACTRESS_FILTER_RANGES.bust.defaultMax}
            unit={ACTRESS_FILTER_RANGES.bust.unit}
            gteValue={filters.gte_bust}
            lteValue={filters.lte_bust}
            onChange={handleInputChange}
          />

          {/* ウエスト */}
          <RangeSlider
            label={ACTRESS_FILTER_RANGES.waist.label}
            fieldPrefix="waist"
            min={ACTRESS_FILTER_RANGES.waist.min}
            max={ACTRESS_FILTER_RANGES.waist.max}
            defaultMin={ACTRESS_FILTER_RANGES.waist.defaultMin}
            defaultMax={ACTRESS_FILTER_RANGES.waist.defaultMax}
            unit={ACTRESS_FILTER_RANGES.waist.unit}
            gteValue={filters.gte_waist}
            lteValue={filters.lte_waist}
            onChange={handleInputChange}
          />

          {/* ヒップ */}
          <RangeSlider
            label={ACTRESS_FILTER_RANGES.hip.label}
            fieldPrefix="hip"
            min={ACTRESS_FILTER_RANGES.hip.min}
            max={ACTRESS_FILTER_RANGES.hip.max}
            defaultMin={ACTRESS_FILTER_RANGES.hip.defaultMin}
            defaultMax={ACTRESS_FILTER_RANGES.hip.defaultMax}
            unit={ACTRESS_FILTER_RANGES.hip.unit}
            gteValue={filters.gte_hip}
            lteValue={filters.lte_hip}
            onChange={handleInputChange}
          />

          {/* 身長 */}
          <RangeSlider
            label={ACTRESS_FILTER_RANGES.height.label}
            fieldPrefix="height"
            min={ACTRESS_FILTER_RANGES.height.min}
            max={ACTRESS_FILTER_RANGES.height.max}
            defaultMin={ACTRESS_FILTER_RANGES.height.defaultMin}
            defaultMax={ACTRESS_FILTER_RANGES.height.defaultMax}
            unit={ACTRESS_FILTER_RANGES.height.unit}
            gteValue={filters.gte_height}
            lteValue={filters.lte_height}
            onChange={handleInputChange}
          />

          {/* 生年月日 */}
          <div className="md:col-span-2">
            <label className={FORM_STYLES.label.main}>
              生年月日
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filters.gte_birthday}
                onChange={(e) => handleInputChange('gte_birthday', e.target.value)}
                className={FORM_STYLES.date}
              />
              <span className="text-gray-400">〜</span>
              <input
                type="date"
                value={filters.lte_birthday}
                onChange={(e) => handleInputChange('lte_birthday', e.target.value)}
                className={FORM_STYLES.date}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              例: 1990-01-01 〜 2000-12-31 で1990年代生まれを検索
            </p>
          </div>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-4">
        <button
          type="submit"
          className={`flex-1 ${BUTTON_STYLES.primaryWithOffset}`}
        >
          🔍 検索
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={BUTTON_STYLES.secondaryWithOffset}
        >
          リセット
        </button>
      </div>
    </form>
  );
}

