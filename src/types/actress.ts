/**
 * 女優検索関連の型定義
 */

export interface ActressFormState {
  keyword: string;
  page: string;
  sort: string;
  gte_bust: string;
  lte_bust: string;
  gte_waist: string;
  lte_waist: string;
  gte_hip: string;
  lte_hip: string;
  gte_height: string;
  lte_height: string;
  gte_birthday: string;
  lte_birthday: string;
  [key: string]: string;
}

export interface ActressFilterRange {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface ActressSearchParams {
  keyword?: string;
  page?: string;
  sort?: string;
  gte_bust?: string;
  lte_bust?: string;
  gte_waist?: string;
  lte_waist?: string;
  gte_hip?: string;
  lte_hip?: string;
  gte_height?: string;
  lte_height?: string;
  gte_birthday?: string;
  lte_birthday?: string;
}