/**
 * フィルター適用ユーティリティ
 */

import { DMMItem } from '@/types/dmm';
import { ItemFilters } from '@/types/filters';

function parsePrice(priceString: string | undefined): number {
  if (!priceString) return 0;
  const cleanPrice = priceString.replace(/[^\d]/g, '').trim();
  const numericPrice = parseInt(cleanPrice, 10);
  return isNaN(numericPrice) || numericPrice < 0 ? 0 : numericPrice;
}

function parseRating(ratingString: string | undefined): number {
  if (!ratingString) return 0;
  const numericRating = parseFloat(ratingString);
  return isNaN(numericRating) || numericRating < 0 ? 0 : numericRating;
}

function parseDuration(durationString: string | undefined): number {
  if (!durationString) return 0;
  const numericDuration = parseInt(durationString, 10);
  return isNaN(numericDuration) || numericDuration < 0 ? 0 : numericDuration;
}

function parseDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch {
    return null;
  }
}

export function matchesFilters(item: DMMItem, filters: ItemFilters): boolean {
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const itemPrice = parsePrice(item.prices?.price);
    if (filters.minPrice !== undefined && itemPrice < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && itemPrice > filters.maxPrice) return false;
  }

  if (filters.startDate || filters.endDate) {
    const itemDate = parseDate(item.date);
    if (itemDate) {
      if (filters.startDate) {
        const startDate = parseDate(filters.startDate);
        if (startDate && itemDate < startDate) return false;
      }
      if (filters.endDate) {
        const endDate = parseDate(filters.endDate);
        if (endDate && itemDate > endDate) return false;
      }
    }
  }

  if (filters.minRating !== undefined) {
    const itemRating = parseRating(item.review?.average);
    if (itemRating < filters.minRating) return false;
    if (item.review?.count === 0 || !item.review) return false;
  }

  if (filters.minDuration !== undefined) {
    const itemDuration = parseDuration(item.volume);
    if (itemDuration < filters.minDuration) return false;
  }

  const actressCount = item.iteminfo?.actress?.length || 0;
  if (filters.minActressCount !== undefined && actressCount < filters.minActressCount) return false;
  if (filters.maxActressCount !== undefined && actressCount > filters.maxActressCount) return false;

  return true;
}

export function applyFilters(items: DMMItem[], filters: ItemFilters): DMMItem[] {
  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');
  if (!hasActiveFilters) return items;
  return items.filter(item => matchesFilters(item, filters));
}

export function countActiveFilters(filters: ItemFilters): number {
  return Object.values(filters).filter(value => value !== undefined && value !== '').length;
}

