#!/usr/bin/env tsx

/**
 * メインサイトマップと商品サイトマップを生成するスクリプト
 * 
 * 使用方法:
 *   tsx scripts/generate-sitemaps.ts
 * 
 * または package.json のスクリプトから:
 *   npm run sitemap:generate:all
 * 
 * このスクリプトはビルド前に実行し、public/ に静的ファイルを生成します。
 * Function invocationsを削減するため、動的生成ではなく静的ファイル配信に切り替えます。
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { getArticleList } from '../src/lib/articles';

const baseUrl = 'https://www.avscope.jp';
const outputDir = join(process.cwd(), 'public');

/**
 * XMLエスケープ
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * サイトマップXMLを生成
 */
function generateSitemapXml(urls: Array<{
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
}>): string {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * メインサイトマップを生成
 */
async function generateMainSitemap(): Promise<string> {
  const currentDate = new Date().toISOString();

  // 静的ページ
  const staticPages = [
    {
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      loc: `${baseUrl}/articles`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/actresses`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/genre`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.9',
    },
    {
      loc: `${baseUrl}/rankings`,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: '0.9',
    },
    // /search は noindex のためサイトマップから除外
    {
      loc: `${baseUrl}/advertise`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.4',
    },
  ];

  // 記事ページ
  let articlePages: Array<{
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }> = [];
  
  try {
    const articles = await getArticleList();
    articlePages = articles.map(article => ({
      loc: `${baseUrl}/articles/${article.slug}`,
      lastmod: article.updatedAt 
        ? new Date(article.updatedAt).toISOString()
        : new Date(article.publishedAt).toISOString(),
      changefreq: 'weekly',
      priority: article.featured ? '0.8' : '0.7',
    }));
  } catch (error) {
    console.error('Error fetching articles for sitemap:', error);
  }

  // ジャンルページ（主要ジャンル、静的）
  const genrePages = [
    { id: 1001, name: 'コスプレ' },
    { id: 1002, name: '制服' },
    { id: 1003, name: 'ロリータ' },
    { id: 1004, name: '熟女' },
    { id: 1005, name: '人妻' },
    { id: 1006, name: '巨乳' },
    { id: 1007, name: '美少女' },
    { id: 1008, name: 'ギャル' },
    { id: 1009, name: 'アニメ' },
    { id: 1010, name: '3D' },
  ].map(genre => ({
    loc: `${baseUrl}/genre/${genre.id}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.5',
  }));

  // メーカーページ（主要メーカー、静的）
  const makerPages = [
    { id: 2001, name: 'SODクリエイト' },
    { id: 2002, name: 'MOODYZ' },
    { id: 2003, name: 'S1 No.1 STYLE' },
    { id: 2004, name: 'IDEAPOCKET' },
    { id: 2005, name: 'PREMIUM' },
    { id: 2006, name: 'FALENO' },
    { id: 2007, name: 'kawaii' },
    { id: 2008, name: 'Madonna' },
    { id: 2009, name: 'ATTACKERS' },
    { id: 2010, name: 'Wanz Factory' },
  ].map(maker => ({
    loc: `${baseUrl}/maker/${maker.id}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.5',
  }));

  // シリーズページ（主要シリーズ、静的）
  const seriesPages = [
    { id: 3001, name: 'S1 No.1 STYLE' },
    { id: 3002, name: 'MOODYZ' },
    { id: 3003, name: 'IDEAPOCKET' },
    { id: 3004, name: 'PREMIUM' },
    { id: 3005, name: 'FALENO' },
  ].map(series => ({
    loc: `${baseUrl}/series/${series.id}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.4',
  }));

  // 全ページを結合
  const allPages = [
    ...staticPages,
    ...articlePages,
    ...genrePages,
    ...makerPages,
    ...seriesPages,
  ];

  return generateSitemapXml(allPages);
}

/**
 * メイン処理
 */
async function main() {
  console.log('📝 Sitemap生成を開始します...');
  console.log(`   ベースURL: ${baseUrl}`);
  console.log(`   出力ディレクトリ: ${outputDir}`);

  // 出力ディレクトリの作成
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  try {
    // メインサイトマップを生成
    console.log('\n📖 メインサイトマップを生成中...');
    const mainSitemap = await generateMainSitemap();
    const mainSitemapPath = join(outputDir, 'sitemap.xml');
    writeFileSync(mainSitemapPath, mainSitemap, 'utf8');
    console.log(`   ✅ sitemap.xml を生成しました (${mainSitemap.length} bytes)`);

    console.log('\n✨ Sitemap生成が完了しました！');
    console.log('\n📊 生成されたファイル:');
    console.log(`   - ${mainSitemapPath}`);
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

