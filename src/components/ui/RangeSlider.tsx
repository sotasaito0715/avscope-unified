'use client';

import { useCallback } from 'react';

// ============================================
// 型定義
// ============================================

interface RangeSliderProps {
  label: string;
  fieldPrefix: 'bust' | 'waist' | 'hip' | 'height';
  min: number;
  max: number;
  defaultMin: number;
  defaultMax: number;
  unit?: string;
  gteValue: string;
  lteValue: string;
  onChange: (field: string, value: string) => void;
}

// ============================================
// スタイル定数
// ============================================

const STYLES = {
  container: "space-y-3",
  label: "block text-sm font-medium text-gray-300 mb-3",
  rangeContainer: "space-y-3",
  controlRow: "space-y-1",
  controlHeader: "flex items-center justify-between mb-1",
  controlLabel: "text-xs text-gray-500",
  checkboxLabel: "flex items-center gap-1 text-xs text-gray-400 cursor-pointer",
  checkbox: "w-3 h-3 text-red-600 bg-[#1a1a1a] border-[#333333] rounded focus:ring-red-500",
  slider: "w-full h-2 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-30 disabled:cursor-not-allowed",
} as const;

// ============================================
// コンポーネント
// ============================================

/**
 * レンジスライダーコンポーネント
 * 
 * @description
 * 最小値・最大値を設定できるレンジスライダー。
 * 「上限なし」「下限なし」のチェックボックス付き。
 * 
 * @param label - 表示ラベル（例: "バスト"）
 * @param fieldPrefix - フィールド名のプレフィックス（例: "bust"）
 * @param min - スライダーの最小値
 * @param max - スライダーの最大値
 * @param defaultMin - デフォルトの最小値
 * @param defaultMax - デフォルトの最大値
 * @param unit - 単位（デフォルト: "cm"）
 * @param gteValue - 現在の最小値（gte_xxx）
 * @param lteValue - 現在の最大値（lte_xxx）
 * @param onChange - 値変更時のコールバック
 * 
 * @example
 * ```tsx
 * <RangeSlider
 *   label="バスト"
 *   fieldPrefix="bust"
 *   min={70}
 *   max={110}
 *   defaultMin={70}
 *   defaultMax={110}
 *   gteValue={filters.gte_bust}
 *   lteValue={filters.lte_bust}
 *   onChange={handleInputChange}
 * />
 * ```
 */
export function RangeSlider({
  label,
  fieldPrefix,
  min,
  max,
  defaultMin,
  defaultMax,
  unit = 'cm',
  gteValue,
  lteValue,
  onChange,
}: RangeSliderProps) {
  const gteField = `gte_${fieldPrefix}`;
  const lteField = `lte_${fieldPrefix}`;

  const handleGteChange = useCallback((value: string) => {
    onChange(gteField, value);
  }, [gteField, onChange]);

  const handleLteChange = useCallback((value: string) => {
    onChange(lteField, value);
  }, [lteField, onChange]);

  const handleGteCheckbox = useCallback((checked: boolean) => {
    onChange(gteField, checked ? '' : defaultMin.toString());
  }, [gteField, onChange, defaultMin]);

  const handleLteCheckbox = useCallback((checked: boolean) => {
    onChange(lteField, checked ? '' : defaultMax.toString());
  }, [lteField, onChange, defaultMax]);

  const displayMin = gteValue ? `${gteValue}${unit}` : '下限なし';
  const displayMax = lteValue ? `${lteValue}${unit}` : '上限なし';

  return (
    <div className={STYLES.container}>
      {/* ラベル */}
      <label className={STYLES.label}>
        {label}: {displayMin} 〜 {displayMax}
      </label>

      <div className={STYLES.rangeContainer}>
        {/* 最小値 */}
        <div className={STYLES.controlRow}>
          <div className={STYLES.controlHeader}>
            <label htmlFor={`${fieldPrefix}-min`} className={STYLES.controlLabel}>
              最小値
            </label>
            <label className={STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!gteValue}
                onChange={(e) => handleGteCheckbox(e.target.checked)}
                className={STYLES.checkbox}
              />
              下限なし
            </label>
          </div>
          <input
            id={`${fieldPrefix}-min`}
            type="range"
            min={min}
            max={max}
            step="1"
            value={gteValue || defaultMin}
            onChange={(e) => handleGteChange(e.target.value)}
            disabled={!gteValue}
            className={STYLES.slider}
          />
        </div>

        {/* 最大値 */}
        <div className={STYLES.controlRow}>
          <div className={STYLES.controlHeader}>
            <label htmlFor={`${fieldPrefix}-max`} className={STYLES.controlLabel}>
              最大値
            </label>
            <label className={STYLES.checkboxLabel}>
              <input
                type="checkbox"
                checked={!lteValue}
                onChange={(e) => handleLteCheckbox(e.target.checked)}
                className={STYLES.checkbox}
              />
              上限なし
            </label>
          </div>
          <input
            id={`${fieldPrefix}-max`}
            type="range"
            min={min}
            max={max}
            step="1"
            value={lteValue || defaultMax}
            onChange={(e) => handleLteChange(e.target.value)}
            disabled={!lteValue}
            className={STYLES.slider}
          />
        </div>
      </div>
    </div>
  );
}

