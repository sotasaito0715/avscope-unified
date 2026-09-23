#!/usr/bin/env node
/**
 * AV Scope 記事自動生成スクリプト
 *
 * Google Sheets から Status=PENDING（空欄も PENDING 扱い）の行を最大 N 件取得し、
 * DMM/FANZA API でランキングデータを取得 → Gemini で Markdown 記事を生成 →
 * content/articles/{slug}.md に保存 → Sheets の Status を DONE に更新する。
 *
 * slug は Type / Target_Word_or_ID / 日付からアプリ側で生成する（Sheets の ID 列は不要）。
 * 生成結果は Slug 列があれば書き戻す。
 *
 * 必要な環境変数:
 *   GEMINI_API_KEY
 *   GOOGLE_SHEET_ID
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   DMM_API_ID
 *   DMM_AFFILIATE_ID
 *   ARTICLE_BATCH_SIZE（任意・デフォルト1）: 1実行あたり処理する PENDING 件数
 *
 * スプレッドシート想定ヘッダー（1行目）:
 *   Status | Type | Target_Word_or_ID | Slug | GeneratedAt | Notes
 *   - Slug: 任意（空ならアプリが生成して書き戻す）
 *
 * Status (Enum, 大文字):
 *   PENDING | PROCESSING | DONE | ERROR | SKIPPED
 *   ※ 空欄 / null は PENDING として扱う
 *
 * Type (Enum, 大文字):
 *   ACTRESS | GENRE | MAKER | KEYWORD
 *   - ACTRESS / GENRE / MAKER: article + article_id = Target_Word_or_ID
 *   - KEYWORD: keyword = Target_Word_or_ID
 */

import { createHash, randomInt } from 'crypto';
import { promises as fs, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(REPO_ROOT, 'content', 'articles');
const GENRES_PATH = path.join(REPO_ROOT, 'data', 'genres', 'genres_summary.json');
const ACTRESSES_PATH = path.join(REPO_ROOT, 'data', 'actress', 'actresses_summary.json');
const WORK_DIR = path.join(REPO_ROOT, 'scripts', 'article-generation');

/** ランキング掲載件数（一時的に上位3件に制限して出力トークンを抑える） */
const RANKING_LIMIT = 3;
/** 1作品あたりプロンプトに載せる出演女優の上限 */
const ACTRESS_LIMIT_PER_ITEM = 6;
/** 1作品あたり本文に貼るサンプル画像の上限（sampleImageURL.sample_l.image） */
const SAMPLE_IMAGE_LIMIT = 3;
const SAMPLE_H4_FALLBACKS = [
  '#### この作品の魅力',
  '#### こんな人におすすめ',
  '#### 見どころとポイント',
];

/**
 * ローカル実行用に .env.local / .env を読み込む。
 * 既に process.env にある値は上書きしない（GitHub Actions の secrets 優先）。
 */
function loadEnvFiles() {
  for (const name of ['.env.local', '.env']) {
    const filePath = path.join(REPO_ROOT, name);
    if (!existsSync(filePath)) continue;

    const content = readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq <= 0) continue;

      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith("'") && value.endsWith("'")) ||
        (value.startsWith('"') && value.endsWith('"'))
      ) {
        value = value.slice(1, -1);
      }

      if (process.env[key] === undefined || process.env[key] === '') {
        process.env[key] = value;
      }
    }
  }
}

loadEnvFiles();

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const SITE_BASE = 'https://www.avscope.jp';
/** 1実行あたり処理する PENDING 件数（1日の生成件数）。環境変数で上書き可 */
const ARTICLE_BATCH_SIZE = (() => {
  const raw = Number.parseInt(process.env.ARTICLE_BATCH_SIZE || '1', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
})();

const STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  ERROR: 'ERROR',
  SKIPPED: 'SKIPPED',
};

const TYPES = new Set(['ACTRESS', 'GENRE', 'MAKER', 'KEYWORD']);

const ALLOWED_MAKERS_RAW = `
Aircontrol, BeFree, E-BODY, Fitch, HHH,
kawaii*, kira☆kira, MVG, OPERA, OPPAI,
ROOKIE, Ｖ, アタッカーズ, えむっ娘ラボ, ダスッ！,
NPJ(旧：ナンパJAPAN), はじめ企画, ビビアン, ワンズファクトリー,
痴女ヘヴン, 変態紳士倶楽部, 本中, 未満, 無垢, 溜池ゴロー,
アイデアポケット, PREMIUM, Madonna, マドンナ, MOODYZ,
グローバルメディアエンタテインメント, グローバルメディアアネックス,
桃太郎映像出版, ドグマ, アリスJAPAN, 宇宙企画,
ケイ・エム・プロデュース, BAZOOKA, メディアステーション,
S1, MUTEKI, ルネピクチャーズ, 豊彦, DOC,
アイドル・芸能人
`;

// ============================================
// ユーティリティ
// ============================================

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function normalize(s) {
  return (s || '').trim().toLowerCase();
}

/** 実行時刻の ISO（ミリ秒なし、UTC）。publishedAt / updatedAt / GeneratedAt 用 */
function nowIso(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function loadAllowedMakers() {
  const makers = [];
  for (const line of ALLOWED_MAKERS_RAW.trim().split('\n')) {
    for (const part of line.split(',')) {
      const m = part.trim();
      if (m && !makers.includes(m)) makers.push(m);
    }
  }
  return makers;
}

function cell(row, ...keys) {
  for (const key of keys) {
    try {
      const v = row.get(key);
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        return String(v).trim();
      }
    } catch {
      // header が無い場合は無視
    }
  }
  return '';
}

function setCell(row, key, value) {
  try {
    row.set(key, value);
    return true;
  } catch {
    return false;
  }
}

/** 空欄 / null は PENDING。比較は大文字正規化。 */
function normalizeStatus(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return STATUS.PENDING;
  }
  return String(raw).trim().toUpperCase();
}

function normalizeType(raw) {
  return String(raw || '').trim().toUpperCase();
}

function isValidSlugId(id) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(id);
}

/** Asia/Tokyo の YYYY-MM-DD（記事 slug の日付部分） */
function jstDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Asia/Tokyo の年・月（見出しの「XXXX年Y月最新」用。月はゼロ埋めしない） */
function jstYearMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value || String(date.getUTCFullYear());
  const month = parts.find((p) => p.type === 'month')?.value || String(date.getUTCMonth() + 1);
  return {
    year,
    month,
    label: `${year}年${month}月`,
    latestBracket: `【${year}年${month}月最新】`,
  };
}

/**
 * 「【2026年最新】」「【2026年最新版】」などを【2026年8月最新】に揃える。
 * title / 見出し / description など Markdown 全体に適用。
 */
function enforceLatestMonthLabel(markdown, year, month) {
  const replacement = `【${year}年${month}月最新】`;
  return String(markdown || '').replace(
    new RegExp(`【\\s*${year}\\s*年\\s*最新(?:版)?\\s*】`, 'g'),
    replacement
  );
}

/**
 * 本文の「## よくある質問」セクションを除去する（faq は frontmatter + UI のみ）。
 * Front Matter は触らない。
 */
function stripBodyFaqSection(markdown) {
  const text = String(markdown || '');
  const fmMatch = text.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n)/);
  const head = fmMatch ? fmMatch[1] : '';
  let body = fmMatch ? text.slice(head.length) : text;

  body = body.replace(
    /(?:^|\n)(?:---\s*\n+)?##\s*よくある質問[^\n]*\n[\s\S]*?(?=(?:\n##\s+)|\s*$)/,
    '\n'
  );
  body = body.replace(/\n{3,}/g, '\n\n');
  body = body.replace(/(?:\n---\s*){2,}\n/g, '\n\n---\n\n');
  return head + body;
}

/** KEYWORD 用: ASCII は正規化、日本語などは短いハッシュにフォールバック */
function slugifyKeywordSegment(text) {
  const raw = String(text || '').trim();
  const ascii = raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  if (ascii) return ascii;
  const hash = createHash('sha1').update(raw).digest('hex').slice(0, 8);
  return `kw-${hash}`;
}

/**
 * Type / Target から slug を生成する。
 * 同じトピックは日付付きURLを増やさず、1本を更新する。
 * 例: actress-1012910-ranking
 */
function buildSlugBase(type, target) {
  const t = String(target || '').trim();
  switch (type) {
    case 'ACTRESS':
      return `actress-${t}-ranking`;
    case 'GENRE':
      return `genre-${t}-ranking`;
    case 'MAKER':
      return `maker-${t}-ranking`;
    case 'KEYWORD':
      return `keyword-${slugifyKeywordSegment(t)}-ranking`;
    default:
      throw new Error(`Cannot generate slug for type: ${type}`);
  }
}

function toEvergreenArticleSlug(slug) {
  return String(slug || '').replace(/-\d{4}-\d{2}-\d{2}$/, '');
}

function quoteYamlScalar(value) {
  const text = String(value ?? '').trim().replace(/^["']|["']$/g, '');
  if (text === '') return '""';
  if (/[:#{}[\],&*!|>'"%@`]/.test(text) || /^-/.test(text) || /\s/.test(text)) {
    return JSON.stringify(text);
  }
  return text;
}

async function readOldestPublishedAt(slug) {
  let files;
  try {
    files = await fs.readdir(ARTICLES_DIR);
  } catch {
    return null;
  }
  const related = files.filter(
    (file) => file === `${slug}.md` || (file.startsWith(`${slug}-`) && file.endsWith('.md'))
  );
  let oldest = null;
  for (const file of related) {
    try {
      const content = await fs.readFile(path.join(ARTICLES_DIR, file), 'utf8');
      const match = content.match(/^publishedAt:\s*["']?([^\n"']+)/m);
      if (!match) continue;
      const raw = match[1].trim();
      const time = Date.parse(raw);
      if (Number.isNaN(time)) continue;
      if (oldest == null || time < oldest.time) oldest = { time, raw };
    } catch {
      // ignore unreadable dated copies
    }
  }
  return oldest?.raw ?? null;
}

/**
 * Slug 列があればそれを優先（有効なときのみ）。なければ Type/Target から生成。
 * 日付付き slug は evergreen に正規化する。
 */
function resolveArticleSlug(row, type, target) {
  const fromSheet = cell(row, 'Slug', 'slug');
  if (fromSheet) {
    const normalized = toEvergreenArticleSlug(fromSheet);
    if (!isValidSlugId(normalized)) {
      throw new Error(`Invalid Slug in sheet: ${fromSheet}`);
    }
    return normalized;
  }
  return buildSlugBase(type, target);
}

function stripCodeFences(text) {
  let out = text.trim();
  // 全体がコードフェンスで囲まれている場合
  const fenced = out.match(/^```(?:markdown|md|yaml|yml)?\s*\n([\s\S]*?)\n```\s*$/i);
  if (fenced) {
    return fenced[1].trim();
  }
  // 先頭フェンスのみ
  if (out.startsWith('```')) {
    out = out.replace(/^```(?:markdown|md|yaml|yml)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }
  return out.trim();
}

/**
 * Gemini 出力から Front Matter 付き Markdown を取り出す。
 * 前置き文・コードフェンス・BOM があっても、最初の --- ... --- ブロック以降を採用する。
 */
function normalizeGeneratedMarkdown(text) {
  let out = String(text || '').replace(/^\uFEFF/, '').trim();
  out = stripCodeFences(out);

  if (out.startsWith('---')) {
    return out;
  }

  // 「以下が記事です」などの前置きの後に Front Matter があるケース
  const fmMatch = out.match(/(^|\n)(---\r?\n[\s\S]*?\r?\n---\r?\n[\s\S]*)$/);
  if (fmMatch) {
    return fmMatch[2].trim();
  }

  // コードフェンス内に Front Matter があるケース
  const innerFence = out.match(/```(?:markdown|md|yaml|yml)?\s*\n([\s\S]*?)\n```/i);
  if (innerFence) {
    const inner = innerFence[1].trim();
    if (inner.startsWith('---')) return inner;
    const nested = inner.match(/(^|\n)(---\r?\n[\s\S]*?\r?\n---\r?\n[\s\S]*)$/);
    if (nested) return nested[2].trim();
  }

  return out;
}

function extractYamlList(markdown, key) {
  const re = new RegExp(`^${key}:\\s*\\n((?:\\s+-\\s+.+(?:\\n|$))+)`, 'm');
  const match = markdown.match(re);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^\s*-\s+/, '').trim())
    .filter(Boolean);
}

// ============================================
// Google Sheets
// ============================================

async function openSheet() {
  const email = requireEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const key = requireEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n');
  const sheetId = requireEnv('GOOGLE_SHEET_ID');

  const auth = new JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(sheetId, auth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  await sheet.loadHeaderRow();
  return sheet;
}

async function findPendingRow(sheet) {
  const rows = await sheet.getRows();
  for (const row of rows) {
    const status = normalizeStatus(cell(row, 'Status'));
    if (status === STATUS.PENDING) {
      return row;
    }
  }
  return null;
}

async function markRow(row, { status, notes, generatedAt, slug }) {
  if (status) setCell(row, 'Status', status);
  if (generatedAt) setCell(row, 'GeneratedAt', generatedAt);
  if (notes !== undefined) setCell(row, 'Notes', notes);
  if (slug) setCell(row, 'Slug', slug);
  await row.save();
}

// ============================================
// DMM / FANZA
// ============================================

async function loadGenres() {
  try {
    const raw = await fs.readFile(GENRES_PATH, 'utf-8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch {
    return [];
  }
}

async function loadActresses() {
  try {
    const raw = await fs.readFile(ACTRESSES_PATH, 'utf-8');
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch {
    return [];
  }
}

function findGenreNameById(genres, genreId) {
  const id = String(genreId);
  const hit = genres.find((g) => String(g.genre_id) === id);
  return hit?.genre_name || '';
}

function findActressNameById(actresses, actressId) {
  const id = String(actressId);
  const hit = actresses.find((a) => String(a.id) === id);
  return hit?.name || '';
}

/**
 * 商品の iteminfo.actress から、スプレッドシート指定の ActressID に一致する要素を返す。
 * 複数女優が紐づく商品でも [0] を使わず必ず ID 照合する。
 */
function findActressInItem(item, actressId) {
  const id = String(actressId);
  for (const a of item.iteminfo?.actress || []) {
    if (a?.id != null && String(a.id) === id) {
      return { id: String(a.id), name: (a.name || '').trim() };
    }
  }
  return null;
}

/**
 * 商品の iteminfo.genre から、スプレッドシート指定の GenreID に一致する要素を返す。
 * 複数ジャンルが紐づく商品でも [0] を使わず必ず ID 照合する。
 */
function findGenreInItem(item, genreId) {
  const id = String(genreId);
  for (const g of item.iteminfo?.genre || []) {
    if (g?.id != null && String(g.id) === id) {
      return { id: String(g.id), name: (g.name || '').trim() };
    }
  }
  return null;
}

/** ランキング商品群から、指定 ActressID に一致する名前を探す */
function resolveActressNameFromItems(items, actressId) {
  for (const item of items || []) {
    const hit = findActressInItem(item, actressId);
    if (hit?.name) return hit.name;
  }
  return '';
}

/** ランキング商品群から、指定 GenreID に一致する名前を探す */
function resolveGenreNameFromItems(items, genreId) {
  for (const item of items || []) {
    const hit = findGenreInItem(item, genreId);
    if (hit?.name) return hit.name;
  }
  return '';
}

/**
 * DMM 取得後に、スプレッドシートの Target(ID) と各商品の iteminfo を照合する。
 * 一致しない商品は除外（API結果の取り違え・ノイズ対策）。
 */
function filterItemsByTargetId(items, type, target) {
  const id = String(target || '').trim();
  if (!id) return items;
  if (type === 'ACTRESS') {
    return items.filter((item) => Boolean(findActressInItem(item, id)));
  }
  if (type === 'GENRE') {
    return items.filter((item) => Boolean(findGenreInItem(item, id)));
  }
  return items;
}

/**
 * Type に応じて ItemList を呼ぶ
 * @returns {Promise<object[]>}
 */
async function fetchItemListByType(apiId, affiliateId, type, target) {
  const params = new URLSearchParams({
    api_id: apiId,
    affiliate_id: affiliateId,
    site: 'FANZA',
    service: 'digital',
    floor: 'videoa',
    hits: '100',
    offset: '1',
    sort: 'rank',
    output: 'json',
  });

  if (type === 'KEYWORD') {
    params.set('keyword', target);
  } else if (type === 'ACTRESS') {
    params.set('article', 'actress');
    params.set('article_id', target);
  } else if (type === 'GENRE') {
    params.set('article', 'genre');
    params.set('article_id', target);
  } else if (type === 'MAKER') {
    params.set('article', 'maker');
    params.set('article_id', target);
  } else {
    throw new Error(`Unsupported Type: ${type}`);
  }

  const url = `https://api.dmm.com/affiliate/v3/ItemList?${params.toString()}`;
  console.log(`📡 DMM ItemList: type=${type}, target=${target}`);

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'AVScope-ArticleGen/1.0',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`DMM ItemList API failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data?.result?.items || [];
}

function isVr(item) {
  const title = (item.title || '').trim();
  if (/VR|【VR】/i.test(title)) return true;
  for (const g of item.iteminfo?.genre || []) {
    if (/VR/i.test(g.name || '')) return true;
  }
  return false;
}

function makerAllowed(makerName, allowed) {
  const mn = (makerName || '').trim();
  if (!mn) return false;
  const mnNorm = normalize(mn);
  for (const a of allowed) {
    const aNorm = normalize(a);
    if (mnNorm === aNorm || mnNorm.includes(aNorm) || aNorm.includes(mnNorm)) {
      return true;
    }
  }
  if (mn.includes('マドンナ') || /madonna/i.test(mn)) {
    return allowed.some((x) => /madonna/i.test(x) || x.includes('マドンナ'));
  }
  return false;
}

function getMakerName(item) {
  const makers = item.iteminfo?.maker || [];
  if (makers[0]?.name) return makers[0].name.trim();
  if (item.maker?.name) return String(item.maker.name).trim();
  return '';
}

function filterItems(items, allowedMakers, { applyMakerFilter }) {
  return items.filter((item) => {
    if (isVr(item)) return false;
    if (!applyMakerFilter) return true;
    return makerAllowed(getMakerName(item), allowedMakers);
  });
}

function getContentId(item) {
  return (item.content_id || '').trim();
}

function getActressIds(item) {
  const ids = [];
  for (const a of item.iteminfo?.actress || []) {
    if (a?.id) ids.push(String(a.id));
  }
  return ids;
}

function normalizeImageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((url) => typeof url === 'string' && url.trim()).map((url) => url.trim());
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

/**
 * DMM ItemList の sampleImageURL.sample_l.image[] を配列として取り出す。
 * レスポンスがオブジェクト / 配列、image が文字列 / 配列のいずれでも扱う。
 */
function getSampleLImages(item) {
  const sampleImageURL = item?.sampleImageURL;
  if (!sampleImageURL) return [];
  const entries = Array.isArray(sampleImageURL) ? sampleImageURL : [sampleImageURL];
  const urls = [];
  for (const entry of entries) {
    urls.push(...normalizeImageList(entry?.sample_l?.image));
  }
  return urls;
}

/** 最大 max 件をランダム抽出するが、元配列の順番は維持する */
function pickRandomSubsetPreservingOrder(items, max) {
  if (items.length <= max) return items.slice();
  const indices = items.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices
    .slice(0, max)
    .sort((a, b) => a - b)
    .map((i) => items[i]);
}

function pickSampleImages(item, max = SAMPLE_IMAGE_LIMIT) {
  return pickRandomSubsetPreservingOrder(getSampleLImages(item), max);
}

function escapeMarkdownAlt(text) {
  return String(text || 'サンプル').replace(/[[\]\r\n]/g, ' ').trim().slice(0, 80);
}

function parseMarkdownImageLine(line) {
  const match = String(line || '').trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if (!match) return null;
  return { alt: match[1], url: match[2].trim() };
}

function unusedFallbackH4s(section, count) {
  const existing = new Set(
    [...section.matchAll(/^####\s+(.+)$/gm)].map((m) => m[1].trim())
  );
  const extras = [];
  for (const heading of SAMPLE_H4_FALLBACKS) {
    const label = heading.replace(/^####\s+/, '');
    if (!existing.has(label)) extras.push(heading);
    if (extras.length >= count) return extras;
  }
  let n = 1;
  while (extras.length < count) {
    const label = `視聴ポイント${n}`;
    if (!existing.has(label)) extras.push(`#### ${label}`);
    n += 1;
  }
  return extras;
}

function insertExtraH4s(section, headings) {
  if (headings.length === 0) return section;
  const extra = `${headings.join('\n\n')}\n\n`;
  const cta = section.search(/\n- \[[^\]]+\]\([^)]+\)/);
  if (cta >= 0) {
    return `${section.slice(0, cta + 1)}${extra}${section.slice(cta + 1)}`;
  }
  const hr = section.lastIndexOf('\n---');
  if (hr >= 0) {
    return `${section.slice(0, hr + 1)}${extra}${section.slice(hr + 1)}`;
  }
  return `${section.trimEnd()}\n\n${extra}`;
}

function splitRankSections(markdown) {
  const re = /^###\s*\d+位[^\n]*/gm;
  const matches = [...markdown.matchAll(re)];
  if (matches.length === 0) {
    return { prefix: markdown, sections: [], suffix: '' };
  }

  const prefix = markdown.slice(0, matches[0].index);
  const sections = [];
  for (let i = 0; i < matches.length; i += 1) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    sections.push(markdown.slice(start, end));
  }

  let suffix = '';
  const last = sections[sections.length - 1];
  const summaryAt = last.search(/^##\s+/m);
  if (summaryAt > 0) {
    suffix = last.slice(summaryAt);
    sections[sections.length - 1] = last.slice(0, summaryAt);
  }

  return { prefix, sections, suffix };
}

function injectSamplesIntoRankSection(section, item) {
  const samples = Array.isArray(item?.sampleImages) ? item.sampleImages : [];
  if (samples.length === 0) return section;

  const sampleSet = new Set(samples);
  let text = section
    .split('\n')
    .filter((line) => {
      const image = parseMarkdownImageLine(line);
      return !(image && sampleSet.has(image.url));
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  const h4Count = [...text.matchAll(/^####\s+/gm)].length;
  if (h4Count < samples.length) {
    text = insertExtraH4s(text, unusedFallbackH4s(text, samples.length - h4Count));
  }

  const lines = text.split('\n');
  const out = [];
  let sampleIdx = 0;
  for (const line of lines) {
    out.push(line);
    if (sampleIdx < samples.length && /^####\s+\S/.test(line)) {
      const url = samples[sampleIdx];
      const alt = escapeMarkdownAlt(`${item.title || '作品'} サンプル${sampleIdx + 1}`);
      out.push('');
      out.push(`![${alt}](${url})`);
      out.push('');
      sampleIdx += 1;
    }
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Gemini 出力の各順位セクションに、sampleImages を API 順で h4 直下へ1枚ずつ差し込む。
 * モデルがまとめ置き・順番入れ替えしても、最終 Markdown では順番を保証する。
 */
function injectSampleImagesIntoMarkdown(markdown, items) {
  const rankingItems = Array.isArray(items) ? items : [];
  if (rankingItems.length === 0) return markdown;

  const { prefix, sections, suffix } = splitRankSections(markdown);
  if (sections.length === 0) return markdown;

  const unused = [...rankingItems];
  const rewritten = sections.map((section, index) => {
    const byId = unused.findIndex(
      (item) => item.content_id && section.includes(`/item/${item.content_id}`)
    );
    const itemIndex = byId >= 0 ? byId : 0;
    const item = unused.splice(itemIndex, 1)[0] || rankingItems[index];
    return item ? injectSamplesIntoRankSection(section, item) : section;
  });

  return `${prefix}${rewritten.join('')}${suffix}`;
}

/**
 * Gemini 入力用に商品を簡略化。
 * ACTRESS / GENRE のときはスプレッドシート Target ID に一致する要素を先頭に置き、
 * matched_* フィールドで明示する（複数紐づき時の取り違え防止）。
 */
function simplifyItem(item, rank, { type, target } = {}) {
  let actresses = (item.iteminfo?.actress || []).map((a) => ({
    id: a.id != null ? String(a.id) : '',
    name: (a.name || '').trim(),
  }));
  let genres = (item.iteminfo?.genre || [])
    .map((g) => ({
      id: g.id != null ? String(g.id) : '',
      name: (g.name || '').trim(),
    }))
    .filter((g) => g.name);

  let matchedActress = null;
  let matchedGenre = null;

  if (type === 'ACTRESS' && target) {
    const targetId = String(target);
    const idx = actresses.findIndex((a) => a.id === targetId);
    if (idx >= 0) {
      matchedActress = actresses[idx];
      if (idx > 0) {
        actresses = [matchedActress, ...actresses.filter((_, i) => i !== idx)];
      }
    }
  }

  if (type === 'GENRE' && target) {
    const targetId = String(target);
    const idx = genres.findIndex((g) => g.id === targetId);
    if (idx >= 0) {
      matchedGenre = genres[idx];
      if (idx > 0) {
        genres = [matchedGenre, ...genres.filter((_, i) => i !== idx)];
      }
    }
  }

  actresses = actresses.slice(0, ACTRESS_LIMIT_PER_ITEM);
  const genreNames = genres.map((g) => g.name).slice(0, 8);
  const image =
    item.imageURL?.large ||
    item.sampleImageURL?.sample_l?.image?.[0] ||
    item.imageURL?.list ||
    '';
  const sampleImages = pickSampleImages(item, SAMPLE_IMAGE_LIMIT);

  const simplified = {
    rank,
    title: item.title || '',
    content_id: getContentId(item),
    // プロンプト肥大化・安全フィルタ誤爆を避けるため短いURLのみ
    affiliateURL: (item.affiliateURL || item.URL || '').slice(0, 180),
    imageURL: image,
    sampleImages,
    maker: getMakerName(item),
    actresses,
    genres: genreNames,
    volume: item.volume || '',
    review: item.review
      ? {
          average: item.review.average,
          count: item.review.count,
        }
      : null,
  };

  if (matchedActress) {
    simplified.matched_actress = matchedActress;
  }
  if (matchedGenre) {
    simplified.matched_genre = matchedGenre;
  }

  return simplified;
}

/**
 * 記事タイトル等に使う表示名。
 * スプレッドシートの Target ID（GenreID / ActressID）を正とし、
 * ローカルマスタ → DMM商品内の ID 照合の順で解決する。
 * ※ 商品の actress[0] / genre[0] は使わない（複数紐づき時の取り違え防止）。
 */
function resolveDisplayLabel(type, target, items, { genreName = '', actressName = '' } = {}) {
  if (type === 'KEYWORD') return target;
  if (type === 'GENRE') {
    return (
      genreName ||
      resolveGenreNameFromItems(items, target) ||
      `ジャンルID ${target}`
    );
  }
  if (type === 'ACTRESS') {
    return (
      actressName ||
      resolveActressNameFromItems(items, target) ||
      `女優ID ${target}`
    );
  }
  if (type === 'MAKER') {
    const name = getMakerName(items[0] || {});
    return name || `メーカーID ${target}`;
  }
  return target;
}

function resolveExploreLink(type, target) {
  if (type === 'GENRE') return `/genre/${target}`;
  if (type === 'ACTRESS') return `/actress/${target}`;
  if (type === 'MAKER') return `/maker/${target}`;
  return '/';
}

async function collectRelatedArticleSlugs(needle, limit = 3) {
  try {
    const files = await fs.readdir(ARTICLES_DIR);
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    const hits = [];

    for (const file of mdFiles) {
      const content = await fs.readFile(path.join(ARTICLES_DIR, file), 'utf-8');
      if (content.includes(needle)) {
        const slugMatch = content.match(/^slug:\s*["']?([^\s"'\n]+)/m);
        if (slugMatch) hits.push(slugMatch[1]);
      }
      if (hits.length >= limit) break;
    }
    return hits;
  } catch {
    return [];
  }
}

// ============================================
// Gemini
// ============================================

function buildPrompt({
  type,
  target,
  displayLabel,
  exploreLink,
  slug,
  year,
  month,
  yearMonthLabel,
  latestBracket,
  publishedAt,
  rankingData,
  relatedArticleSlugs,
}) {
  const typeGuide = {
    ACTRESS: '指定女優の人気作品ランキング記事',
    GENRE: '指定ジャンルの人気作品ランキング記事',
    MAKER: '指定メーカーの人気作品ランキング記事',
    KEYWORD: 'キーワード検索結果に基づく人気作品ランキング記事',
  }[type];

  return `あなたは AV Scope（avscope.jp）の編集者です。以下のランキングデータと仕様に従い、SEOに強い日本語の Markdown 記事を1本だけ出力してください。

# 絶対ルール
- 出力の1文字目から Front Matter を始めること。先頭は必ず --- のみ（前置き・挨拶・説明文は禁止）。
- 出力は Front Matter（YAML）+ Markdown 本文のみ。後書き・コードフェンス（\`\`\`）も禁止。
- サイト名は「AV Scope」「avscope.jp」に統一（hentaitok 等は禁止）。
- 内部リンクは相対パス: 作品=/item/{content_id}, ジャンル=/genre/{genre_id}, 女優=/actress/{id}, メーカー=/maker/{id}
- 身長・スリーサイズ・お気に入り登録数などの定型プロフィールのみの紹介は禁止。
- お気に入り登録数は記載しない。
- title は60文字以内、description は160文字以内。タイトルは「おすすめ3選」「人気ランキングTOP3」など3件であることが分かる表現にする。
- 「最新」を示す括弧見出しは必ず「${latestBracket}」形式にする（例: title や本文 H1）。「【${year}年最新】」「【${year}年最新版】」は禁止。年月は ${yearMonthLabel} を使うこと。
- FAQ は frontmatter の faq に必ず3件。howTo は任意。
- primaryKeyword には「${displayLabel}」を設定。
- **title / 見出し / 導入文の主題は必ず display_label「${displayLabel}」（target=${target}）を使うこと。**
- 商品に複数の女優・ジャンルが紐づいていても、他の女優名・ジャンル名で title / primaryKeyword / H1 を置き換えてはならない。
- ranking_data の各 item に matched_actress / matched_genre がある場合は、それがスプレッドシート指定 ID と照合済みの正解である。
- slug は必ず「${slug}」にする（変更禁止）。日付は付けず、同じトピックは同じ URL を更新する。
- publishedAt / updatedAt は必ず「${publishedAt}」にする（実行時刻・変更禁止）。
- relatedArticleSlugs が空でなければ Front Matter に含める。
- ランキングは **上位${RANKING_LIMIT}件のみ**（### 1位〜### ${RANKING_LIMIT}位）。4位以降は絶対に書かない。
- relatedItems / ranking_data.items は入力の件数に合わせる（最大${RANKING_LIMIT}件）。
- 本文末尾に「## まとめ」を置く。
- **本文に「## よくある質問」や FAQ の再掲は書かない**（faq は frontmatter のみ。UI側で表示する）。
- 各 item の sampleImages は sample_l から選んだ最大${SAMPLE_IMAGE_LIMIT}枚。**配列の順番どおり**に使う（前後入れ替え禁止）。
- サンプル画像は作品内でまとめ置きせず、**#### 小見出しの直後に1枚ずつ**貼る。sampleImages の件数と同じ数の #### を書く。
- パッケージ画像は imageURL を ### 見出し直下に1枚だけ。sampleImages の URL をパッケージ代わりに使わない。

# Front Matter 必須項目
---
slug: ${slug}
title: ...（最新を示す場合は ${latestBracket} を含める）
description: ...
excerpt: ...
published: true
publishedAt: ${publishedAt}
updatedAt: ${publishedAt}
author:
  name: AV Scope編集部
  role: 編集長
category: ランキング
tags: [...]
keywords: [...]
primaryKeyword: ${displayLabel}
ogImage: （1位の画像URL）
ogImageAlt: ...
canonicalUrl: ${SITE_BASE}/articles/${slug}
featured: true
priority: 80
relatedItems: [...]
relatedActresses: [...]
relatedArticleSlugs: ${JSON.stringify(relatedArticleSlugs)}
faq:
  - q: ...
    a: ...
---

# 本文構成
1. 導入（結論先行で ${displayLabel} のおすすめを案内）
2. **${displayLabel}を探すならAV Scope！** セクション＋ [関連ページを見る](${exploreLink})
3. ランキング本体（${typeGuide}）※ **1位〜${RANKING_LIMIT}位のみ**
   - ### 1位 / ### 2位 / ### 3位 形式（これ以上は禁止）
   - パッケージ画像: ### 直下に ![alt](imageURL) を1枚
   - sampleImages がある作品は、その件数（1〜${SAMPLE_IMAGE_LIMIT}）と同じ数の #### 小見出しを書く
   - 各 #### の直後に sampleImages を先頭から1枚ずつ ![alt](url) で貼る。まとめ置き・順番変更・間引きは禁止
   - sampleImages が空なら従来どおり #### を2つ（この作品の魅力 / こんな人におすすめ 等）
   - 詳細リンクと購入リンクを付ける
4. ## まとめ
（※ 「## よくある質問」は本文に含めない）

# 入力データ
- type: ${type}
- target: ${target}
- display_label: ${displayLabel}
- explore_link: ${exploreLink}
- year: ${year}
- month: ${month}
- year_month_label: ${yearMonthLabel}
- latest_bracket: ${latestBracket}
- relatedArticleSlugs: ${JSON.stringify(relatedArticleSlugs)}
- ranking_data (JSON):
${JSON.stringify(rankingData, null, 2)}
`;
}

function extractTextFromGeminiResponse(response) {
  if (!response) return { text: '', detail: 'no response object' };

  try {
    const direct = response.text?.() || '';
    if (direct.trim()) {
      return { text: direct, detail: 'ok' };
    }
  } catch (err) {
    // text() は SAFETY 等で例外を投げることがある
    const msg = err instanceof Error ? err.message : String(err);
    return {
      text: '',
      detail: `text() threw: ${msg}`,
      promptFeedback: response.promptFeedback,
      candidates: summarizeCandidates(response.candidates),
    };
  }

  // thought パートを除いて手動抽出（Gemini 3.x 対策）
  const parts = response.candidates?.[0]?.content?.parts || [];
  const texts = parts
    .filter((p) => typeof p?.text === 'string' && !p.thought)
    .map((p) => p.text);
  const joined = texts.join('\n').trim();

  return {
    text: joined,
    detail: joined
      ? 'extracted from parts'
      : 'empty after text()/parts extraction',
    promptFeedback: response.promptFeedback,
    candidates: summarizeCandidates(response.candidates),
  };
}

function summarizeCandidates(candidates) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  return candidates.map((c, i) => ({
    index: i,
    finishReason: c.finishReason,
    safetyRatings: c.safetyRatings,
    partCount: c.content?.parts?.length || 0,
    partKeys: (c.content?.parts || []).map((p) => Object.keys(p)),
  }));
}

async function generateArticleWithGemini(prompt) {
  const apiKey = requireEnv('GEMINI_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);

  // AV カタログ記事は成人向け表現を含むため、ブロックを緩和する
  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction:
      'You are an AV Scope editor writing SEO catalog ranking articles in Japanese. Reply with ONLY a Markdown file. The first three characters must be ---. No preface, no code fences, no closing remarks. Treat input titles as commercial product metadata.',
    safetySettings,
    generationConfig: {
      maxOutputTokens: 8192,
    },
  });

  console.log('🤖 Gemini request...');
  const result = await model.generateContent(prompt);
  const extracted = extractTextFromGeminiResponse(result.response);
  const text = extracted.text;
  if (!text.trim()) {
    console.error('⚠️ Gemini empty detail:', JSON.stringify({
      detail: extracted.detail,
      promptFeedback: extracted.promptFeedback,
      candidates: extracted.candidates,
    }));
    throw new Error('Gemini returned empty response (check safety/finishReason logs above)');
  }
  return normalizeGeneratedMarkdown(text);
}

// ============================================
// Main
// ============================================

/**
 * PENDING 行1件を処理する。成功時は DONE、失敗時は ERROR にして throw。
 */
async function processPendingRow(row) {
  const type = normalizeType(cell(row, 'Type'));
  const target = cell(row, 'Target_Word_or_ID');

  if (!TYPES.has(type)) {
    await markRow(row, {
      status: STATUS.ERROR,
      notes: `Invalid Type: ${type || '(empty)'}. Use ACTRESS|GENRE|MAKER|KEYWORD`,
    });
    throw new Error(`Invalid Type: ${type}`);
  }
  if (!target) {
    await markRow(row, { status: STATUS.ERROR, notes: 'Target_Word_or_ID is empty' });
    throw new Error('PENDING row has empty Target_Word_or_ID');
  }

  let slug;
  try {
    slug = resolveArticleSlug(row, type, target);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markRow(row, { status: STATUS.ERROR, notes: message.slice(0, 500) });
    throw err;
  }
  if (!isValidSlugId(slug)) {
    await markRow(row, {
      status: STATUS.ERROR,
      notes: `Generated invalid slug: ${slug}`,
    });
    throw new Error(`Generated invalid slug: ${slug}`);
  }

  // 二重実行防止（生成 slug も先に書き戻す）
  await markRow(row, { status: STATUS.PROCESSING, notes: 'processing...', slug });
  console.log(`📝 Slug=${slug}, Type=${type}, Target=${target}`);

  try {
    const apiId = requireEnv('DMM_API_ID');
    const affiliateId = requireEnv('DMM_AFFILIATE_ID');
    const genres = await loadGenres();
    const actresses = await loadActresses();
    // スプレッドシート Target を正として、ローカルマスタから表示名を解決
    const genreNameFromMaster = type === 'GENRE' ? findGenreNameById(genres, target) : '';
    const actressNameFromMaster = type === 'ACTRESS' ? findActressNameById(actresses, target) : '';

    const rawItems = await fetchItemListByType(apiId, affiliateId, type, target);
    console.log(`📦 Fetched ${rawItems.length} items`);

    const allowed = loadAllowedMakers();
    // MAKER 指定時はメーカー許可リストを適用しない（対象メーカー自体を出すため）
    const applyMakerFilter = type !== 'MAKER';
    const filteredByMaker = filterItems(rawItems, allowed, { applyMakerFilter });
    console.log(`✅ After VR${applyMakerFilter ? ' + maker' : ''} filter: ${filteredByMaker.length}`);

    // DMM 取得後にスプレッドシートの GenreID / ActressID と照合（複数紐づきの取り違え防止）
    const filtered = filterItemsByTargetId(filteredByMaker, type, target);
    if (type === 'ACTRESS' || type === 'GENRE') {
      const dropped = filteredByMaker.length - filtered.length;
      console.log(
        `🔎 Matched by sheet ${type} ID=${target}: ${filtered.length}` +
          (dropped > 0 ? ` (dropped ${dropped} unmatched)` : '')
      );
    }

    if (filtered.length === 0) {
      await markRow(row, {
        status: STATUS.ERROR,
        notes: 'No items after VR/maker/target-ID filter',
        generatedAt: nowIso(),
        slug,
      });
      throw new Error('No items after filtering');
    }

    // 女優特集記事の場合、単体女優作品を優先（3件以上あれば単体のみ、なければ複数女優も許可）
    let topItems;
    if (type === 'ACTRESS') {
      const soloItems = filtered.filter((item) => (item.iteminfo?.actress?.length || 0) === 1);
      const multiItems = filtered.filter((item) => (item.iteminfo?.actress?.length || 0) > 1);
      console.log(`👩 Solo actress items: ${soloItems.length}, Multi actress items: ${multiItems.length}`);
      if (soloItems.length >= RANKING_LIMIT) {
        topItems = soloItems.slice(0, RANKING_LIMIT);
        console.log(`✅ Using solo actress items only (${topItems.length} items)`);
      } else {
        topItems = [...soloItems, ...multiItems].slice(0, RANKING_LIMIT);
        console.log(`⚠️ Not enough solo items, mixing with multi: solo=${soloItems.length}, total=${topItems.length}`);
      }
    } else {
      topItems = filtered.slice(0, RANKING_LIMIT);
    }
    const relatedItems = topItems.map(getContentId).filter(Boolean);
    let relatedActresses = [];
    if (type === 'ACTRESS') {
      // 女優記事はスプレッドシート指定の ActressID のみを正とする
      relatedActresses = [String(target)];
    } else {
      const seenActress = new Set();
      for (const item of topItems) {
        for (const actressId of getActressIds(item).slice(0, ACTRESS_LIMIT_PER_ITEM)) {
          if (!seenActress.has(actressId)) {
            seenActress.add(actressId);
            relatedActresses.push(actressId);
          }
        }
      }
    }

    // 表示名: マスタ → DMM商品内の ID 照合（actress[0]/genre[0] は使わない）
    const displayLabel = resolveDisplayLabel(type, target, topItems, {
      genreName: genreNameFromMaster,
      actressName: actressNameFromMaster,
    });
    const exploreLink = resolveExploreLink(type, target);
    console.log(`🏷️ display_label=${displayLabel} (type=${type}, target=${target})`);

    const rankingData = {
      mode: 'item',
      type,
      target,
      displayLabel,
      // スプレッドシート照合済みの正解 ID / 表示名
      matched_target: {
        type,
        id: String(target),
        label: displayLabel,
      },
      limit: RANKING_LIMIT,
      items: topItems.map((item, i) => simplifyItem(item, i + 1, { type, target })),
      relatedItems,
      relatedActresses,
      note:
        topItems.length < RANKING_LIMIT
          ? `該当が少なかったため${topItems.length}件に絞っています`
          : `上位${RANKING_LIMIT}件のみ掲載`,
    };
    for (const it of rankingData.items) {
      console.log(
        `🖼 rank ${it.rank} ${it.content_id}: ${it.sampleImages.length} sample image(s)`
      );
    }

    await fs.mkdir(WORK_DIR, { recursive: true });
    const workFile = path.join(WORK_DIR, `response-${slug}.json`);
    await fs.writeFile(
      workFile,
      JSON.stringify(
        {
          slug,
          type,
          target,
          display_label: displayLabel,
          total_before_filter: rawItems.length,
          total_after_filter: filtered.length,
          ranking_data: rankingData,
        },
        null,
        2
      ),
      'utf-8'
    );
    console.log(`💾 Saved work JSON: ${workFile}`);

    // 同じトピックは evergreen slug を上書き更新する。publishedAt は初回、updatedAt は実行時刻。
    const updatedAt = nowIso();
    const publishedAt = (await readOldestPublishedAt(slug)) || updatedAt;
    const { year, month, label: yearMonthLabel, latestBracket } = jstYearMonth();
    const relatedArticleSlugs = await collectRelatedArticleSlugs(displayLabel, 3);

    const prompt = buildPrompt({
      type,
      target,
      displayLabel,
      exploreLink,
      slug,
      year,
      month,
      yearMonthLabel,
      latestBracket,
      publishedAt,
      rankingData,
      relatedArticleSlugs,
    });

    console.log(`🤖 Calling Gemini (${GEMINI_MODEL})...`);
    let markdown = await generateArticleWithGemini(prompt);

    if (!markdown.startsWith('---')) {
      const previewPath = path.join(WORK_DIR, `raw-${slug}.txt`);
      await fs.writeFile(previewPath, markdown.slice(0, 4000), 'utf-8');
      console.error('⚠️ Markdown preview (first 300 chars):', JSON.stringify(markdown.slice(0, 300)));
      console.error(`⚠️ Raw output saved: ${previewPath}`);
      throw new Error('Generated markdown does not start with Front Matter (---)');
    }

    // slug / publishedAt / updatedAt を生成値に強制
    if (/^slug:\s*.+$/m.test(markdown)) {
      markdown = markdown.replace(/^slug:\s*.+$/m, `slug: ${slug}`);
    } else {
      markdown = markdown.replace(/^---\n/, `---\nslug: ${slug}\n`);
    }
    if (/^publishedAt:\s*.+$/m.test(markdown)) {
      markdown = markdown.replace(/^publishedAt:\s*.+$/m, `publishedAt: ${publishedAt}`);
    } else {
      markdown = markdown.replace(/^---\n/, `---\npublishedAt: ${publishedAt}\n`);
    }
    if (/^updatedAt:\s*.+$/m.test(markdown)) {
      markdown = markdown.replace(/^updatedAt:\s*.+$/m, `updatedAt: ${updatedAt}`);
    } else {
      markdown = markdown.replace(/^publishedAt:\s*.+$/m, `publishedAt: ${publishedAt}\nupdatedAt: ${updatedAt}`);
    }

    // primaryKeyword はスプレッドシート照合済みの displayLabel に強制（取り違え防止）
    if (/^primaryKeyword:\s*.+$/m.test(markdown)) {
      markdown = markdown.replace(/^primaryKeyword:\s*.+$/m, `primaryKeyword: ${displayLabel}`);
    } else {
      markdown = markdown.replace(/^---\n/, `---\nprimaryKeyword: ${displayLabel}\n`);
    }

    // title に displayLabel が無い場合は安全なデフォルトに差し替え
    const titleMatch = markdown.match(/^title:\s*(.+)$/m);
    if (titleMatch) {
      const currentTitle = titleMatch[1].trim();
      if (displayLabel && !currentTitle.includes(displayLabel)) {
        const safeTitle =
          type === 'ACTRESS'
            ? `${displayLabel} 人気動画おすすめ${RANKING_LIMIT}選${latestBracket}`
            : type === 'GENRE'
              ? `${displayLabel}AVおすすめランキング${latestBracket}人気作品TOP${RANKING_LIMIT}`
              : `${displayLabel}おすすめランキング${latestBracket}TOP${RANKING_LIMIT}`;
        markdown = markdown.replace(/^title:\s*.+$/m, `title: ${safeTitle.slice(0, 60)}`);
        console.warn(`⚠️ title did not include display_label; replaced with: ${safeTitle.slice(0, 60)}`);
      }
    }

    for (const key of ['title', 'description', 'excerpt']) {
      const field = markdown.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
      if (field) {
        markdown = markdown.replace(
          new RegExp(`^${key}:\\s*.+$`, 'm'),
          `${key}: ${quoteYamlScalar(field[1])}`
        );
      }
    }

    // 【YYYY年最新】系を【YYYY年M月最新】に正規化
    markdown = enforceLatestMonthLabel(markdown, year, month);
    // 本文の「よくある質問」は UI（frontmatter faq）と重複するため除去
    markdown = stripBodyFaqSection(markdown);
    // サンプル画像を各 #### 直下へ API 順で1枚ずつ差し込む
    markdown = injectSampleImagesIntoMarkdown(markdown, rankingData.items);

    if (!/^relatedItems:/m.test(markdown) && relatedItems.length > 0) {
      markdown = markdown.replace(
        /^---\n/,
        `---\nrelatedItems:\n${relatedItems.map((cid) => `  - ${cid}`).join('\n')}\n`
      );
    }
    if (!/^relatedActresses:/m.test(markdown) && relatedActresses.length > 0) {
      markdown = markdown.replace(
        /^---\n/,
        `---\nrelatedActresses:\n${relatedActresses.map((aid) => `  - ${aid}`).join('\n')}\n`
      );
    }

    await fs.mkdir(ARTICLES_DIR, { recursive: true });
    const outPath = path.join(ARTICLES_DIR, `${slug}.md`);
    await fs.writeFile(outPath, markdown.endsWith('\n') ? markdown : `${markdown}\n`, 'utf-8');
    console.log(`📰 Article saved: ${outPath}`);

    await markRow(row, {
      status: STATUS.DONE,
      generatedAt: publishedAt,
      notes: `generated ${slug} (${type}=${target}, label=${displayLabel})`,
      slug,
    });
    console.log('✅ Spreadsheet Status updated to DONE');

    console.log('Frontmatter relatedItems sample:', extractYamlList(markdown, 'relatedItems').slice(0, 3));
    console.log(`Done: ${slug}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // すでに ERROR 済みでなければ書き戻す
    const current = normalizeStatus(cell(row, 'Status'));
    if (current === STATUS.PROCESSING || current === STATUS.PENDING) {
      await markRow(row, {
        status: STATUS.ERROR,
        generatedAt: nowIso(),
        notes: message.slice(0, 500),
        slug,
      });
    }
    throw err;
  }
}

async function main() {
  console.log(`🚀 Auto article generation started (batch size=${ARTICLE_BATCH_SIZE})`);

  const sheet = await openSheet();
  let success = 0;
  let failed = 0;

  for (let i = 0; i < ARTICLE_BATCH_SIZE; i += 1) {
    const row = await findPendingRow(sheet);
    if (!row) {
      if (i === 0) {
        console.log('ℹ️ No PENDING rows found. Exiting successfully.');
      } else {
        console.log(`ℹ️ No more PENDING rows after ${success} success / ${failed} failed.`);
      }
      break;
    }

    console.log(`\n——— Batch ${i + 1}/${ARTICLE_BATCH_SIZE} ———`);
    try {
      await processPendingRow(row);
      success += 1;
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Batch item failed: ${message}`);
      // 成功分は残すため続行（最終的に1件以上成功していれば exit 0）
    }
  }

  console.log(`\n🏁 Batch finished: success=${success}, failed=${failed}, limit=${ARTICLE_BATCH_SIZE}`);
  if (success === 0 && failed > 0) {
    throw new Error(`All ${failed} article generation attempt(s) failed`);
  }
}

main().catch((err) => {
  console.error('❌ Auto generation failed:', err);
  process.exitCode = 1;
});
