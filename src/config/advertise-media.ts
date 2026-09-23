/**
 * 広告掲載ページ用メディア情報（手動更新）
 * 掲載用にはキリの良い概算で表記しています。
 */

export const ADVERTISE_MEDIA = {
  siteName: 'AV Scope',
  siteUrl: 'https://www.avscope.jp',
  pitch:
    'DMM の人気作品ランキング、女優・ジャンル・キーワード検索、記事コンテンツなどを提供するAV作品情報サイトです。',

  /** 大きく見せる数値（文言そのまま表示） */
  stats: {
    monthlyPv: '6万 PV',
    monthlyPvUnit: 'PV / 月（目安）',
    monthlyUsers: '1.5万ユーザー',
    monthlyUsersUnit: 'ユニークユーザー / 月（目安）',
    statsNote:
      'いずれもおおよその目安です。計測定義はお問い合わせ時にご説明します。',
  },

  /** 流入の傾向（割合は四捨五入した大まかな表現のみ） */
  trafficSummary: {
    title: '流入の傾向',
    lines: [
      '自然検索（オーガニック）からの訪問が、全体のおおよそ 8割前後 を占めています。',
      '直接アクセスは、おおよそ 2割前後 です。',
      'SNS などその他の経路は、まとめて数％程度です。',
    ],
  },
} as const;
