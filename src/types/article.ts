/**
 * おすすめ記事機能の型定義ファイル
 *
 * @description
 * おすすめ記事で使用される型定義を集約。
 * JSONメタデータとMarkdown本文から構成される。
 */

// ============================================
// 記事メタデータの型
// ============================================

export interface ArticleMetadata {
  // 基本情報
  slug: string; // URL用のスラッグ（ファイル名から生成）
  title: string; // 記事タイトル
  description: string; // 記事の説明（SEO用、160文字以内推奨）
  excerpt?: string; // 記事の抜粋（一覧表示用）
  
  // 公開設定
  published: boolean; // 公開/非公開
  publishedAt: string; // 公開日時（ISO 8601形式: YYYY-MM-DD）
  updatedAt?: string; // 更新日時（ISO 8601形式: YYYY-MM-DD）
  
  // カテゴリ・タグ
  category?: string; // カテゴリ（例: "ランキング", "レビュー", "特集"）
  tags?: string[]; // タグ配列
  
  // SEO設定
  keywords?: string[]; // SEOキーワード
  primaryKeyword?: string; // 主要検索クエリ（title/H1/導入文との一致用）
  canonicalUrl?: string; // カノニカルURL（省略可）
  noindex?: boolean; // インデックス禁止フラグ
  nofollow?: boolean; // フォロー禁止フラグ
  
  // OGP画像
  ogImage?: string; // OGP画像のURL（省略可、自動生成される）
  ogImageAlt?: string; // OGP画像の代替テキスト
  
  // 著者情報
  author?: {
    name: string;
    role?: string;
    image?: string;
  };
  
  // 関連作品・女優・記事（オプション）
  relatedItems?: string[]; // 関連作品のcontent_id配列
  relatedActresses?: string[]; // 関連女優のID配列
  relatedArticleSlugs?: string[]; // 関連記事のslug配列（意図的な内部リンク）

  // 構造化データ用（FAQ / HowTo）
  faq?: Array<{
    q: string;
    a: string;
  }>;
  howTo?: {
    name: string;
    steps: string[];
  };
  
  // その他
  featured?: boolean; // おすすめ記事フラグ（トップページなどで強調表示）
  priority?: number; // 表示順序の優先度（数値が大きいほど先頭）
}

// ============================================
// 記事データの型
// ============================================

export interface Article {
  metadata: ArticleMetadata;
  content: string; // Markdown本文
  markdown: string; // 元のMarkdownファイルの内容
}

// ============================================
// 記事一覧用の型
// ============================================

export interface ArticleListItem {
  slug: string;
  title: string;
  description: string;
  excerpt?: string;
  publishedAt: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  ogImage?: string;
  featured?: boolean;
  priority?: number;
}

// ============================================
// デフォルト値
// ============================================

export const DEFAULT_ARTICLE_METADATA: Partial<ArticleMetadata> = {
  published: true,
  noindex: false,
  nofollow: false,
  featured: false,
  priority: 0,
};
