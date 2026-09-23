import type { DMMItem } from '@/types/dmm';
import { hashString } from '@/lib/dmm-utils';

export interface ItemSeoContent {
  descriptionText: string;
  h2Title: string;
  metaDescription: string;
  pageTitle: string;
}

interface ItemSeoContext {
  title: string;
  actressNames: string[];
  actressJoined: string;
  makerName: string;
  genres: string[];
  mainGenres: string;
  volume: string | undefined;
  avg: string | undefined;
  count: number;
}

interface ItemSeoPattern {
  h2Title: string;
  titleSuffix: string;
  intro: (ctx: ItemSeoContext) => string;
  castWithMaker: (ctx: ItemSeoContext) => string;
  castOnly: (ctx: ItemSeoContext) => string;
  makerOnly: (ctx: ItemSeoContext) => string;
  genre: (ctx: ItemSeoContext) => string;
  volume: (ctx: ItemSeoContext) => string;
  review: (ctx: ItemSeoContext) => string;
  fallback: string;
  metaDescription: (ctx: ItemSeoContext) => string;
}

const ITEM_SEO_PATTERNS: ItemSeoPattern[] = [
  {
    h2Title: 'この作品の見どころ',
    titleSuffix: '作品情報・見どころ',
    intro: (ctx) =>
      `「${ctx.title}」は、FANZAで配信されている人気AV作品です。`,
    castWithMaker: (ctx) =>
      `${ctx.actressJoined}が出演し、${ctx.makerName}からリリースされたタイトルで、出演陣とメーカーの両方に惹かれる一本です。`,
    castOnly: (ctx) =>
      `${ctx.actressJoined}がメインで登場し、ファンならチェックしておきたい内容になっています。`,
    makerOnly: (ctx) =>
      `${ctx.makerName}らしい作り込みが光る作品で、メーカー買いする人にも向いています。`,
    genre: (ctx) =>
      `ジャンルは「${ctx.mainGenres}」などが中心で、自分の好みに合うシチュエーションかどうかをイメージしやすくなっています。`,
    volume: (ctx) =>
      `収録時間は約${ctx.volume}分と、じっくり楽しめるボリュームです。`,
    review: (ctx) =>
      `FANZAのレビューは平均${ctx.avg}/5（${ctx.count}件）で、実際に視聴したユーザーからも一定の評価を得ています。`,
    fallback:
      'FANZAで配信されている人気タイトルのひとつで、AV Scopeから詳細ページにそのままアクセスできます。',
    metaDescription: (ctx) =>
      [
        ctx.title,
        ctx.actressJoined && `出演: ${ctx.actressJoined}`,
        ctx.makerName && `メーカー: ${ctx.makerName}`,
        ctx.mainGenres && `ジャンル: ${ctx.mainGenres}`,
      ]
        .filter(Boolean)
        .join(' | '),
  },
  {
    h2Title: '作品情報・おすすめポイント',
    titleSuffix: '詳細レビュー・おすすめ',
    intro: (ctx) =>
      `AV Scopeでは「${ctx.title}」の基本情報と視聴のポイントをまとめています。`,
    castWithMaker: (ctx) =>
      `出演は${ctx.actressJoined}、制作は${ctx.makerName}。キャストとレーベルの組み合わせが魅力の作品です。`,
    castOnly: (ctx) =>
      `主演・出演に${ctx.actressJoined}を迎えた作品で、ファン向けの見どころが詰まっています。`,
    makerOnly: (ctx) =>
      `${ctx.makerName}のラインナップに並ぶ一作として、作風のファンにもおすすめです。`,
    genre: (ctx) =>
      `「${ctx.mainGenres}」などのジャンル要素が軸になっており、好みの傾向と照らし合わせやすい構成です。`,
    volume: (ctx) =>
      `プレイタイムはおよそ${ctx.volume}分。時間を取って視聴したい方向けの尺感です。`,
    review: (ctx) =>
      `ユーザー評価は平均${ctx.avg}点（5点満点・${ctx.count}件）で、口コミの参考にもなります。`,
    fallback:
      '作品の概要と関連情報をAV Scopeで確認し、そのままFANZAの詳細へ進めます。',
    metaDescription: (ctx) => {
      const parts = [
        `「${ctx.title}」の作品情報`,
        ctx.actressJoined && `${ctx.actressJoined}出演`,
        ctx.makerName && `${ctx.makerName}作品`,
        ctx.mainGenres && `${ctx.mainGenres}など`,
      ].filter(Boolean);
      return `${parts.join('。')}。AV Scopeで詳細をチェック。`;
    },
  },
  {
    h2Title: '作品解説＆詳細',
    titleSuffix: '解説・配信情報',
    intro: (ctx) =>
      `配信タイトル「${ctx.title}」について、出演・ジャンル・評価などの要点を整理しました。`,
    castWithMaker: (ctx) =>
      `${ctx.actressJoined}が出演し${ctx.makerName}が手がけた作品で、両者のファンにも刺さりやすい内容です。`,
    castOnly: (ctx) =>
      `${ctx.actressJoined}の出演作として注目度が高く、関連作品を巡る入口にもなります。`,
    makerOnly: (ctx) =>
      `${ctx.makerName}らしい世界観が感じられる作品で、シリーズやレーベル買いの参考にもなります。`,
    genre: (ctx) =>
      `主なジャンルは${ctx.mainGenres}。シチュエーションの方向性が把握しやすい点が特徴です。`,
    volume: (ctx) =>
      `収録尺は約${ctx.volume}分で、短すぎず長すぎない視聴時間帯に収まっています。`,
    review: (ctx) =>
      `レビュー平均${ctx.avg}/5・${ctx.count}件の評価があり、実際の視聴者の反応も確認できます。`,
    fallback:
      'タイトル情報と関連属性をまとめたページです。興味があれば公式の視聴ページへどうぞ。',
    metaDescription: (ctx) => {
      const cast = ctx.actressJoined ? `出演 ${ctx.actressJoined}` : '';
      const maker = ctx.makerName ? `制作 ${ctx.makerName}` : '';
      const genre = ctx.mainGenres ? `ジャンル ${ctx.mainGenres}` : '';
      return [ctx.title, cast, maker, genre].filter(Boolean).join(' / ');
    },
  },
  {
    h2Title: 'この作品の概要',
    titleSuffix: '概要・キャスト情報',
    intro: (ctx) =>
      `「${ctx.title}」はFANZAで視聴できるAV作品のひとつです。`,
    castWithMaker: (ctx) =>
      `キャストに${ctx.actressJoined}、メーカーは${ctx.makerName}。出演者とレーベルの両方から探せます。`,
    castOnly: (ctx) =>
      `出演者は${ctx.actressJoined}。名前で辿ってきた方にも分かりやすい概要です。`,
    makerOnly: (ctx) =>
      `メーカーは${ctx.makerName}。同メーカーの他タイトルとあわせて比較しやすい情報を掲載しています。`,
    genre: (ctx) =>
      `タグ・ジャンル面では「${ctx.mainGenres}」などが付与されており、好みの絞り込みに役立ちます。`,
    volume: (ctx) =>
      `本編の長さは約${ctx.volume}分です。視聴計画の目安にしてください。`,
    review: (ctx) =>
      `FANZA上の平均評価は${ctx.avg}/5（${ctx.count}件）。購入前の参考指標になります。`,
    fallback:
      '作品の基本スペックをAV Scope上で確認できるページです。',
    metaDescription: (ctx) =>
      `${ctx.title}の概要${ctx.actressJoined ? `（出演: ${ctx.actressJoined}）` : ''}${ctx.makerName ? ` / ${ctx.makerName}` : ''}${ctx.mainGenres ? ` / ${ctx.mainGenres}` : ''}`,
  },
  {
    h2Title: '視聴前に知りたいポイント',
    titleSuffix: '視聴ガイド',
    intro: (ctx) =>
      `これから「${ctx.title}」をチェックする方向けに、押さえておきたいポイントをまとめました。`,
    castWithMaker: (ctx) =>
      `${ctx.actressJoined}×${ctx.makerName}の組み合わせが核で、どちら起点でも探しやすい作品です。`,
    castOnly: (ctx) =>
      `${ctx.actressJoined}の出演を軸に楽しむタイプの作品で、ファン層向けの選択肢になります。`,
    makerOnly: (ctx) =>
      `${ctx.makerName}らしい演出・作風を期待する視聴者向けの一本です。`,
    genre: (ctx) =>
      `興味の入口になりやすいジャンルは「${ctx.mainGenres}」。近い系統の作品探索にもつながります。`,
    volume: (ctx) =>
      `約${ctx.volume}分の収録なので、まとまった時間があるときの視聴に向いています。`,
    review: (ctx) =>
      `レビュー平均${ctx.avg}点・${ctx.count}件と、評価データも確認できます。`,
    fallback:
      '視聴前の確認用として、作品の要点だけを簡潔にまとめています。',
    metaDescription: (ctx) => {
      const lead = `${ctx.title}を視聴する前のポイント`;
      const rest = [
        ctx.actressJoined && `出演 ${ctx.actressJoined}`,
        ctx.makerName && `メーカー ${ctx.makerName}`,
        ctx.mainGenres && `ジャンル ${ctx.mainGenres}`,
      ]
        .filter(Boolean)
        .join('・');
      return rest ? `${lead}。${rest}` : lead;
    },
  },
  {
    h2Title: '作品データと見どころまとめ',
    titleSuffix: 'データ・見どころ',
    intro: (ctx) =>
      `「${ctx.title}」の作品データと、選ばれる理由になりやすい見どころを整理しています。`,
    castWithMaker: (ctx) =>
      `出演者に${ctx.actressJoined}、リリース元は${ctx.makerName}。検索・比較の軸として使いやすい情報です。`,
    castOnly: (ctx) =>
      `${ctx.actressJoined}の名前で辿れる作品として、プロフィール経由の導線にも適しています。`,
    makerOnly: (ctx) =>
      `${ctx.makerName}のカタログ上の一タイトルとして、メーカーページからの回遊にもつながります。`,
    genre: (ctx) =>
      `ジャンル属性は「${ctx.mainGenres}」など。近い趣味嗜好の作品へ広げやすい点が利点です。`,
    volume: (ctx) =>
      `収録時間は約${ctx.volume}分。ボリューム感の目安として記載しています。`,
    review: (ctx) =>
      `評価は平均${ctx.avg}/5（${ctx.count}件）。人気度の参考指標として併記しています。`,
    fallback:
      '作品名・属性・評価などの基本データをAV Scopeで一覧できるページです。',
    metaDescription: (ctx) =>
      [
        `${ctx.title}の見どころ`,
        ctx.actressJoined,
        ctx.makerName,
        ctx.mainGenres,
      ]
        .filter(Boolean)
        .join(' - '),
  },
];

function buildContext(item: DMMItem): ItemSeoContext {
  const title = (item.title || '').trim();
  const actressNames =
    item.iteminfo?.actress?.map((a) => a.name).filter(Boolean) ?? [];
  const makerName = item.iteminfo?.maker?.[0]?.name ?? '';
  const genres =
    item.iteminfo?.genre?.map((g) => g.name).filter(Boolean) ?? [];

  return {
    title,
    actressNames,
    actressJoined: actressNames.join('、'),
    makerName,
    genres,
    mainGenres: genres.slice(0, 3).join('・'),
    volume: item.volume,
    avg: item.review?.average,
    count: item.review?.count ?? 0,
  };
}

function selectPattern(contentId: string): ItemSeoPattern {
  const index = hashString(contentId || 'unknown') % ITEM_SEO_PATTERNS.length;
  return ITEM_SEO_PATTERNS[index];
}

/**
 * 商品詳細ページ用のSEOテキストを決定論的に生成する。
 * 同一 content_id では常に同一のパターン・文言になる。
 */
export function buildItemSeoContent(item: DMMItem): ItemSeoContent {
  const ctx = buildContext(item);
  const pattern = selectPattern(item.content_id || '');
  const sentences: string[] = [];

  if (ctx.title) {
    sentences.push(pattern.intro(ctx));
  }

  if (ctx.actressNames.length && ctx.makerName) {
    sentences.push(pattern.castWithMaker(ctx));
  } else if (ctx.actressNames.length) {
    sentences.push(pattern.castOnly(ctx));
  } else if (ctx.makerName) {
    sentences.push(pattern.makerOnly(ctx));
  }

  if (ctx.genres.length) {
    sentences.push(pattern.genre(ctx));
  }

  if (ctx.volume) {
    sentences.push(pattern.volume(ctx));
  }

  if (ctx.avg && ctx.count > 0) {
    sentences.push(pattern.review(ctx));
  }

  if (!sentences.length) {
    sentences.push(pattern.fallback);
  }

  const descriptionText = sentences.join('\n');
  const baseTitle = ctx.title || '作品詳細';
  const pageTitle = ctx.title
    ? `${baseTitle}｜${pattern.titleSuffix}`
    : baseTitle;

  return {
    descriptionText,
    h2Title: pattern.h2Title,
    metaDescription: pattern.metaDescription(ctx) || descriptionText,
    pageTitle,
  };
}
