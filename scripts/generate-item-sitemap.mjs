#!/usr/bin/env node

/**
 * 高品質な人気商品をサイトマップに掲載する。
 * - 品質フィルター通過分を最大 TARGET_ITEMS 件まで収集
 * - 1ファイルあたり MAX_URLS_PER_FILE 件で分割出力
 * - sitemap-items.xml は分割ファイルを指す sitemapindex として出力
 */

import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = 'https://www.avscope.jp';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const INDEX_FILE = path.join(PUBLIC_DIR, 'sitemap-items.xml');
const API_ENDPOINT = 'https://api.dmm.com/affiliate/v3/ItemList';

const TARGET_ITEMS = 20000;
const RANK_ITEMS = 12000;
const DATE_ITEMS = 8000;
const CHUNK_SIZE = 100;
const MAX_URLS_PER_FILE = 5000;
/** 品質除外を見越し、必要なら TARGET を超えて取得を続ける上限 */
const MAX_FETCH_OFFSET = 50000;

function getApiCredentials() {
  const apiId = process.env.DMM_API_ID;
  const affiliateId = process.env.DMM_AFFILIATE_ID;

  if (!apiId || !affiliateId) {
    return null;
  }

  return {
    apiId,
    affiliateId,
    site: process.env.DMM_SITE || 'FANZA',
    service: process.env.DMM_SERVICE || 'digital',
  };
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

/**
 * 低品質ページをサイトマップから除外するゲート
 */
function isHighQualityItem(item) {
  if (!item?.content_id) return false;
  if (!String(item.title || '').trim()) return false;

  const image = item.imageURL?.large || item.imageURL?.list;
  if (!image) return false;

  const actresses = item.iteminfo?.actress;
  const genres = item.iteminfo?.genre;
  const hasActress = Array.isArray(actresses) && actresses.length > 0;
  const hasGenre = Array.isArray(genres) && genres.length > 0;

  return hasActress || hasGenre;
}

function buildUrlsetXml(items) {
  const entries = items
    .map((item) => {
      const lastmod = item.date
        ? new Date(item.date).toISOString()
        : new Date().toISOString();
      return `  <url>
    <loc>${escapeXml(`${BASE_URL}/item/${item.content_id}`)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function buildSitemapIndexXml(partFileNames) {
  const lastmod = new Date().toISOString();
  const entries = partFileNames
    .map(
      (fileName) => `  <sitemap>
    <loc>${escapeXml(`${BASE_URL}/${fileName}`)}</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>
`;
}

async function removePreviousItemSitemaps() {
  const entries = await readdir(PUBLIC_DIR).catch(() => []);
  const targets = entries.filter(
    (name) =>
      name === 'sitemap-items.xml' ||
      /^sitemap-items-\d+\.xml$/.test(name),
  );

  await Promise.all(
    targets.map((name) => unlink(path.join(PUBLIC_DIR, name)).catch(() => {})),
  );
}

async function fetchQualityItemsBySort(credentials, sort, limit, seen) {
  const items = [];
  let fetchedRaw = 0;
  let skipped = 0;

  for (let offset = 1; offset <= MAX_FETCH_OFFSET; offset += CHUNK_SIZE) {
    if (items.length >= limit) {
      break;
    }

    const params = new URLSearchParams({
      api_id: credentials.apiId,
      affiliate_id: credentials.affiliateId,
      output: 'json',
      site: credentials.site,
      service: credentials.service,
      sort,
      hits: String(CHUNK_SIZE),
      offset: String(offset),
    });

    const response = await fetch(`${API_ENDPOINT}?${params.toString()}`, {
      headers: {
        'User-Agent': 'DMM-Affiliate-Search-App/1.0',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`DMM API returned ${response.status}`);
    }

    const data = await response.json();
    const chunk = data?.result?.items ?? [];
    if (!Array.isArray(chunk) || chunk.length === 0) {
      break;
    }

    fetchedRaw += chunk.length;

    for (const item of chunk) {
      if (items.length >= limit) break;
      if (!item?.content_id || seen.has(item.content_id)) {
        skipped += 1;
        continue;
      }
      if (!isHighQualityItem(item)) {
        skipped += 1;
        continue;
      }

      seen.add(item.content_id);
      items.push({
        content_id: item.content_id,
        date: item.date,
      });
    }

    if (chunk.length < CHUNK_SIZE) {
      break;
    }
  }

  return { items, fetchedRaw, skipped };
}

async function fetchQualityItems(credentials) {
  const seen = new Set();
  const rank = await fetchQualityItemsBySort(credentials, 'rank', RANK_ITEMS, seen);
  const newest = await fetchQualityItemsBySort(credentials, 'date', DATE_ITEMS, seen);
  const items = [...rank.items, ...newest.items].slice(0, TARGET_ITEMS);

  return {
    items,
    fetchedRaw: rank.fetchedRaw + newest.fetchedRaw,
    skipped: rank.skipped + newest.skipped,
  };
}

async function writeSplitSitemaps(items) {
  await mkdir(PUBLIC_DIR, { recursive: true });
  await removePreviousItemSitemaps();

  if (items.length === 0) {
    await writeFile(INDEX_FILE, buildSitemapIndexXml([]), 'utf8');
    return [];
  }

  const partFileNames = [];
  const partCount = Math.ceil(items.length / MAX_URLS_PER_FILE);

  for (let i = 0; i < partCount; i += 1) {
    const start = i * MAX_URLS_PER_FILE;
    const chunk = items.slice(start, start + MAX_URLS_PER_FILE);
    const fileName = `sitemap-items-${i + 1}.xml`;
    const filePath = path.join(PUBLIC_DIR, fileName);
    await writeFile(filePath, buildUrlsetXml(chunk), 'utf8');
    partFileNames.push(fileName);
  }

  await writeFile(INDEX_FILE, buildSitemapIndexXml(partFileNames), 'utf8');
  return partFileNames;
}

async function main() {
  const credentials = getApiCredentials();
  if (!credentials) {
    console.warn(
      'DMM API credentials not found. Generating empty sitemap-items index.',
    );
    await mkdir(PUBLIC_DIR, { recursive: true });
    await removePreviousItemSitemaps();
    await writeFile(INDEX_FILE, buildSitemapIndexXml([]), 'utf8');
    return;
  }

  const { items, fetchedRaw, skipped } = await fetchQualityItems(credentials);
  const partFileNames = await writeSplitSitemaps(items);

  console.log(
    `Generated item sitemaps: ${items.length} quality items ` +
      `(raw fetched ${fetchedRaw}, skipped ${skipped}; mix rank+date).`,
  );
  console.log(
    `Files: sitemap-items.xml (index) + ${partFileNames.join(', ') || '(none)'}`,
  );

  try {
    const { spawn } = await import('node:child_process');
    await new Promise((resolve) => {
      const child = spawn(process.execPath, ['scripts/indexnow.mjs', `${BASE_URL}/sitemap-items.xml`], {
        stdio: 'inherit',
      });
      child.on('close', () => resolve());
      child.on('error', () => resolve());
    });
  } catch {
    // IndexNow is best-effort
  }
}

main().catch((error) => {
  console.error('Failed to generate item sitemaps:', error);
  process.exitCode = 1;
});
