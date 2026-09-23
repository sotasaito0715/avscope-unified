#!/usr/bin/env node

/**
 * JSONデータからSitemap XMLファイルを生成するスクリプト
 * 
 * 使用方法:
 *   node scripts/generate-sitemap.js [options]
 * 
 * オプション:
 *   --actresses <path>    女優JSONファイルのパス (デフォルト: ./data/actress/actresses_summary.json)
 *   --genres <path>       ジャンルJSONファイルのパス (デフォルト: ./data/genres/genres_summary.json)
 *   --articles-dir <dir>  記事ディレクトリ (デフォルト: ./content/articles)
 *   --output-dir <dir>    出力ディレクトリ (デフォルト: ./public)
 *   --base-url <url>      ベースURL (デフォルト: https://www.avscope.jp)
 *   --articles-only       記事サイトマップ（sitemap-articles*.xml）のみ生成
 *   --max-urls <number>   1ファイルあたりの最大URL数 (デフォルト: 10000)
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// コマンドライン引数の解析
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    actresses: './data/actress/actresses_summary.json',
    genres: './data/genres/genres_summary.json',
    articlesDir: './content/articles',
    outputDir: './public',
    baseUrl: 'https://www.avscope.jp',
    maxUrls: 10000,
    articlesOnly: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--actresses' && args[i + 1]) {
      options.actresses = args[i + 1];
      i++;
    } else if (args[i] === '--genres' && args[i + 1]) {
      options.genres = args[i + 1];
      i++;
    } else if (args[i] === '--articles-dir' && args[i + 1]) {
      options.articlesDir = args[i + 1];
      i++;
    } else if (args[i] === '--output-dir' && args[i + 1]) {
      options.outputDir = args[i + 1];
      i++;
    } else if (args[i] === '--base-url' && args[i + 1]) {
      options.baseUrl = args[i + 1];
      i++;
    } else if (args[i] === '--max-urls' && args[i + 1]) {
      options.maxUrls = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--articles-only') {
      options.articlesOnly = true;
    }
  }

  return options;
}

/**
 * XMLエスケープ
 */
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sitemap XMLを生成
 */
function generateSitemapXml(urls) {
  const currentDate = new Date().toISOString();
  
  const urlEntries = urls.map(url => {
    const lastmod = url.lastmod || currentDate;
    const changefreq = url.changefreq || 'weekly';
    const priority = url.priority || '0.5';
    
    return `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * URL配列を分割して複数のSitemapファイルを生成
 * @param {Array} urls - URL配列
 * @param {string} baseName - ベースファイル名（例: 'sitemap-actresses'）
 * @param {string} outputDir - 出力ディレクトリ
 * @param {number} maxUrls - 1ファイルあたりの最大URL数
 * @returns {Array} 生成されたファイル名の配列
 */
function generateSplitSitemaps(urls, baseName, outputDir, maxUrls) {
  const files = [];
  const totalFiles = Math.ceil(urls.length / maxUrls);
  
  for (let i = 0; i < totalFiles; i++) {
    const start = i * maxUrls;
    const end = Math.min(start + maxUrls, urls.length);
    const chunk = urls.slice(start, end);
    
    const sitemapXml = generateSitemapXml(chunk);
    const fileName = totalFiles > 1 
      ? `${baseName}-${i + 1}.xml`
      : `${baseName}.xml`;
    const outputPath = path.join(outputDir, fileName);
    
    fs.writeFileSync(outputPath, sitemapXml, 'utf8');
    files.push(fileName);
    
    console.log(`   ✅ ${fileName} を生成しました (${chunk.length}件)`);
  }
  
  return files;
}

/**
 * 記事一覧を取得
 */
function getArticles(articlesDir) {
  const articles = [];
  
  try {
    if (!fs.existsSync(articlesDir)) {
      return articles;
    }
    
    const files = fs.readdirSync(articlesDir).filter(file => file.endsWith('.md'));
    
    for (const file of files) {
      try {
        const filePath = path.join(articlesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        
        // 公開されていない記事は除外
        if (data.published === false) {
          continue;
        }
        
        const slug = data.slug || path.basename(file, '.md');
        articles.push({
          slug,
          publishedAt: data.publishedAt,
          updatedAt: data.updatedAt,
          featured: data.featured || false,
        });
      } catch (error) {
        console.error(`記事ファイル ${file} の読み込みエラー:`, error.message);
      }
    }
  } catch (error) {
    console.error(`記事ディレクトリ ${articlesDir} の読み込みエラー:`, error.message);
  }
  
  return articles;
}

/**
 * メイン処理
 */
function main() {
  const options = parseArgs();

  console.log('📝 Sitemap生成を開始します...');
  console.log(`   ベースURL: ${options.baseUrl}`);
  console.log(`   出力ディレクトリ: ${options.outputDir}`);
  if (options.articlesOnly) {
    console.log('   モード: articles-only（sitemap-articles*.xml のみ）');
  }

  // 出力ディレクトリの作成
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }

  const generatedFiles = {
    actresses: [],
    genres: [],
    articles: [],
  };

  // 女優サイトマップの生成
  if (!options.articlesOnly) {
  if (fs.existsSync(options.actresses)) {
    console.log(`\n📖 女優データを読み込み中: ${options.actresses}`);
    try {
      const actressesData = JSON.parse(fs.readFileSync(options.actresses, 'utf8'));
      
      if (!Array.isArray(actressesData)) {
        throw new Error('女優データは配列である必要があります');
      }

      console.log(`   ✅ ${actressesData.length}件の女優データを読み込みました`);
      
      const currentDate = new Date().toISOString();
      const urls = actressesData.map(actress => ({
        loc: `${options.baseUrl}/actress/${actress.id}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.6',
      }));
      
      const files = generateSplitSitemaps(urls, 'sitemap-actresses', options.outputDir, options.maxUrls);
      generatedFiles.actresses = files;
    } catch (error) {
      console.error(`   ❌ エラー: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`\n⚠️  女優データファイルが見つかりません: ${options.actresses}`);
    console.log('   女優サイトマップはスキップされます');
  }

  // ジャンルサイトマップの生成
  if (fs.existsSync(options.genres)) {
    console.log(`\n📖 ジャンルデータを読み込み中: ${options.genres}`);
    try {
      const genresData = JSON.parse(fs.readFileSync(options.genres, 'utf8'));
      
      if (!Array.isArray(genresData)) {
        throw new Error('ジャンルデータは配列である必要があります');
      }

      console.log(`   ✅ ${genresData.length}件のジャンルデータを読み込みました`);
      
      const currentDate = new Date().toISOString();
      const urls = genresData.map(genre => ({
        loc: `${options.baseUrl}/genre/${genre.genre_id}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: '0.5',
      }));
      
      const files = generateSplitSitemaps(urls, 'sitemap-categories', options.outputDir, options.maxUrls);
      generatedFiles.genres = files;
    } catch (error) {
      console.error(`   ❌ エラー: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log(`\n⚠️  ジャンルデータファイルが見つかりません: ${options.genres}`);
    console.log('   ジャンルサイトマップはスキップされます');
  }
  }

  // 記事サイトマップの生成
  console.log(`\n📖 記事データを読み込み中: ${options.articlesDir}`);
  try {
    const articles = getArticles(options.articlesDir);
    
    if (articles.length > 0) {
      console.log(`   ✅ ${articles.length}件の記事データを読み込みました`);
      
      const urls = articles.map(article => {
        const lastmod = article.updatedAt 
          ? new Date(article.updatedAt).toISOString()
          : article.publishedAt 
            ? new Date(article.publishedAt).toISOString()
            : new Date().toISOString();
        
        return {
          loc: `${options.baseUrl}/articles/${article.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: article.featured ? '0.8' : '0.7',
        };
      });
      
      const files = generateSplitSitemaps(urls, 'sitemap-articles', options.outputDir, options.maxUrls);
      generatedFiles.articles = files;
    } else {
      console.log('   ⚠️  記事が見つかりませんでした');
    }
  } catch (error) {
    console.error(`   ❌ エラー: ${error.message}`);
  }

  // 生成されたファイルのサマリー
  console.log('\n📊 生成されたファイル:');
  if (generatedFiles.actresses.length > 0) {
    console.log(`   女優: ${generatedFiles.actresses.length}ファイル`);
  }
  if (generatedFiles.genres.length > 0) {
    console.log(`   ジャンル: ${generatedFiles.genres.length}ファイル`);
  }
  if (generatedFiles.articles.length > 0) {
    console.log(`   記事: ${generatedFiles.articles.length}ファイル`);
  }

  console.log('\n✨ Sitemap生成が完了しました！');
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = {
  generateSitemapXml,
  generateSplitSitemaps,
  getArticles,
};

