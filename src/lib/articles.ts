/**
 * おすすめ記事データ読み込みユーティリティ
 *
 * @description
 * 記事のJSONメタデータとMarkdown本文を読み込むユーティリティ関数。
 * content/articles/ ディレクトリから記事を読み込みます。
 */

import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Article, ArticleMetadata, ArticleListItem } from '@/types/article';

const DATED_SLUG_SUFFIX = /-\d{4}-\d{2}-\d{2}$/;

export function toEvergreenArticleSlug(slug: string): string {
  return slug.replace(DATED_SLUG_SUFFIX, '');
}

function dropDatedDuplicates(articles: Article[]): Article[] {
  const slugs = new Set(articles.map((article) => article.metadata.slug));
  return articles.filter((article) => {
    const evergreen = toEvergreenArticleSlug(article.metadata.slug);
    return evergreen === article.metadata.slug || !slugs.has(evergreen);
  });
}

// ============================================
// 定数
// ============================================

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');

// ============================================
// ファイルシステム操作
// ============================================

/**
 * 記事ディレクトリが存在するか確認し、存在しない場合は作成
 */
async function ensureArticlesDir() {
  try {
    await fs.access(ARTICLES_DIR);
  } catch {
    await fs.mkdir(ARTICLES_DIR, { recursive: true });
  }
}

/**
 * 記事ファイルの一覧を取得
 */
async function getArticleFiles(): Promise<string[]> {
  await ensureArticlesDir();
  
  try {
    const files = await fs.readdir(ARTICLES_DIR);
    return files.filter(file => file.endsWith('.md'));
  } catch {
    return [];
  }
}

/**
 * 記事ファイルの内容を読み込む
 */
async function readArticleFile(filename: string): Promise<string> {
  const filePath = path.join(ARTICLES_DIR, filename);
  return await fs.readFile(filePath, 'utf-8');
}

// ============================================
// 記事読み込み関数
// ============================================

/**
 * すべての記事を読み込む（公開されているもののみ）
 */
export async function getAllArticles(): Promise<Article[]> {
  const files = await getArticleFiles();
  const articles: Article[] = [];

  for (const file of files) {
    try {
      const content = await readArticleFile(file);
      const { data, content: markdown } = matter(content);
      
      // メタデータを検証
      const metadata = data as Partial<ArticleMetadata>;
      
      // 公開されていない記事は除外
      if (metadata.published === false) {
        continue;
      }
      
      // slugが指定されていない場合はファイル名から生成
      if (!metadata.slug) {
        metadata.slug = path.basename(file, '.md');
      }
      
      articles.push({
        metadata: metadata as ArticleMetadata,
        content: markdown,
        markdown,
      });
    } catch (error) {
      console.error(`Failed to load article ${file}:`, error);
    }
  }

  const uniqueArticles = dropDatedDuplicates(articles);

  // 公開日時でソート（新しい順）
  uniqueArticles.sort((a, b) => {
    const dateA = new Date(a.metadata.publishedAt || 0).getTime();
    const dateB = new Date(b.metadata.publishedAt || 0).getTime();
    return dateB - dateA;
  });

  return uniqueArticles;
}

/**
 * 記事一覧用のデータを取得（軽量版）
 */
export async function getArticleList(): Promise<ArticleListItem[]> {
  const articles = await getAllArticles();
  
  return articles.map(article => ({
    slug: article.metadata.slug,
    title: article.metadata.title,
    description: article.metadata.description,
    excerpt: article.metadata.excerpt,
    publishedAt: article.metadata.publishedAt,
    updatedAt: article.metadata.updatedAt,
    category: article.metadata.category,
    tags: article.metadata.tags,
    ogImage: article.metadata.ogImage,
    featured: article.metadata.featured,
    priority: article.metadata.priority,
  }));
}

/**
 * 特定の記事をslugで取得
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const articles = await getAllArticles();
  return articles.find(article => article.metadata.slug === slug) || null;
}

/**
 * おすすめ記事を取得（featuredフラグがtrueのもの）
 */
export async function getFeaturedArticles(limit?: number): Promise<ArticleListItem[]> {
  const articles = await getArticleList();
  const featured = articles.filter(article => article.featured);
  
  // priorityでソート（降順）
  featured.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * カテゴリ別に記事を取得
 */
export async function getArticlesByCategory(category: string): Promise<ArticleListItem[]> {
  const articles = await getArticleList();
  return articles.filter(article => article.category === category);
}

/**
 * タグ別に記事を取得
 */
export async function getArticlesByTag(tag: string): Promise<ArticleListItem[]> {
  const articles = await getArticleList();
  return articles.filter(article => article.tags?.includes(tag));
}

