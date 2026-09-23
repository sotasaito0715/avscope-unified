/**
 * 広告掲載の料金体系（月額定額・目安）
 * 文言・金額の変更はここを編集してください。
 */

export type AdvertisePlan = {
  id: string;
  name: string;
  priceYen: number;
  description: string;
  features: string[];
};

export const ADVERTISE_PLANS: AdvertisePlan[] = [
  {
    id: 'light',
    name: 'ライト',
    priceYen: 9_800,
    description: 'まずは1枠から試したい方向け',
    features: [
      '1枠（モバイルバナーまたはPCサイドバー）',
      'クリエイティブ1点',
    ],
  },
  {
    id: 'standard',
    name: 'スタンダード',
    priceYen: 29_800,
    description: 'モバイルとPCの両方で露出したい方向け',
    features: [
      '2枠（モバイル＋PC）',
      '一覧・記事ページ中心の配信想定',
      'クリエイティブ1点',
    ],
  },
  {
    id: 'premium',
    name: 'プレミアム',
    priceYen: 59_800,
    description: '主要面をまとめて押さえたい方向け',
    features: [
      'モバイル上・中・下＋PCサイドなど主要枠',
      'クリエイティブ1点',
      '競合排他はオプション（下記）',
    ],
  },
];

export const ADVERTISE_PRICING_OPTIONS: string[] = [
  '競合排他: 月額＋20%',
  'クリエイティブ差し替え（月2回を超える場合）: ＋5,000円／月',
  '最低掲載期間: 1ヶ月〜（3ヶ月以上を推奨）',
  '初回限定: 初月20%OFF（先着3社まで）',
];

export const ADVERTISE_PRICING_NOTES: string[] = [
  '表示価格は税別です。',
  '枠の空き状況・掲載可否は審査のうえ決定いたします。',
  '内容・価格は予告なく変更する場合があります。',
];
