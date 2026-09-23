/**
 * レコメンデーション機能
 *
 * @description
 * 類似作品を推薦するためのユーティリティ関数。
 */

import { DMMItem } from '@/types/dmm';

/**
 * 類似作品を取得（同じ女優、ジャンル、メーカーなど）
 */
export function getSimilarItems(currentItem: DMMItem, allItems: DMMItem[], limit: number = 10): DMMItem[] {
  // 現在の作品と同じIDを除外
  const otherItems = allItems.filter(item => item.content_id !== currentItem.content_id);
  
  // スコア計算関数
  const calculateSimilarityScore = (item: DMMItem): number => {
    let score = 0;

    // 同じ女優（高スコア）
    const currentActressIds = currentItem.iteminfo?.actress?.map(a => a.id) || [];
    const itemActressIds = item.iteminfo?.actress?.map(a => a.id) || [];
    const commonActresses = currentActressIds.filter(id => itemActressIds.includes(id));
    score += commonActresses.length * 50;

    // 同じジャンル
    const currentGenreIds = currentItem.iteminfo?.genre?.map(g => g.id) || [];
    const itemGenreIds = item.iteminfo?.genre?.map(g => g.id) || [];
    const commonGenres = currentGenreIds.filter(id => itemGenreIds.includes(id));
    score += commonGenres.length * 30;

    // 同じメーカー
    const currentMakerIds = currentItem.iteminfo?.maker?.map(m => m.id) || [];
    const itemMakerIds = item.iteminfo?.maker?.map(m => m.id) || [];
    const commonMakers = currentMakerIds.filter(id => itemMakerIds.includes(id));
    score += commonMakers.length * 20;

    // 同じシリーズ
    const currentSeriesIds = currentItem.iteminfo?.series?.map(s => s.id) || [];
    const itemSeriesIds = item.iteminfo?.series?.map(s => s.id) || [];
    const commonSeries = currentSeriesIds.filter(id => itemSeriesIds.includes(id));
    score += commonSeries.length * 40;

    // 評価が高い作品にボーナス
    if (item.review?.count && item.review.count > 0) {
      const rating = parseFloat(item.review.average);
      score += rating * 5;
    }

    return score;
  };

  // スコアを計算してソート
  const scoredItems = otherItems.map(item => ({
    item,
    score: calculateSimilarityScore(item),
  }));

  // スコア順にソート（高い順）
  scoredItems.sort((a, b) => b.score - a.score);

  // 上位N件を返す（スコアが0より大きいもののみ）
  return scoredItems
    .filter(({ score }) => score > 0)
    .slice(0, limit)
    .map(({ item }) => item);
}

/**
 * 人気作品を取得（評価とレビュー数でランキング）
 */
export function getPopularItems(allItems: DMMItem[], limit: number = 10): DMMItem[] {
  const scoredItems = allItems.map(item => {
    let score = 0;
    
    // レビュー数が多いほど高スコア
    if (item.review?.count) {
      score += item.review.count * 2;
    }
    
    // 評価が高いほど高スコア
    if (item.review?.average) {
      const rating = parseFloat(item.review.average);
      score += rating * 10;
    }
    
    return { item, score };
  });

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.slice(0, limit).map(({ item }) => item);
}

