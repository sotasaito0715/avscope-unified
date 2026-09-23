/**
 * Markdownユーティリティ
 *
 * @description
 * Markdownコンテンツからテキストを抽出するためのユーティリティ関数。
 * 構造化データなどでHTMLではなくプレーンテキストが必要な場合に使用します。
 */

export interface TableOfContentsItem {
  id: string;
  level: number;
  text: string;
}

/**
 * Markdownからプレーンテキストを抽出
 * 
 * @param markdown - Markdownコンテンツ
 * @returns 抽出されたプレーンテキスト（最大1000文字）
 */
export function extractPlainTextFromMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  // Markdown記号を削除
  const text = markdown
    // 見出し記号を削除
    .replace(/^#+\s+/gm, '')
    // リスト記号を削除
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // リンクの記号を削除（テキストのみ抽出）
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // 画像の記号を削除（altテキストのみ抽出）
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // 強調記号を削除
    .replace(/\*\*([^\*]+)\*\*/g, '$1')
    .replace(/\*([^\*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // コードブロックを削除
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // 引用記号を削除
    .replace(/^>\s+/gm, '')
    // 水平線を削除
    .replace(/^---+$/gm, '')
    // HTMLタグを削除（基本的なもの）
    .replace(/<[^>]+>/g, '')
    // 改行をスペースに変換
    .replace(/\n+/g, ' ')
    // 連続するスペースを1つに
    .replace(/\s+/g, ' ')
    // 先頭・末尾のスペースを削除
    .trim();
  
  // 最大1000文字に制限（構造化データの推奨制限）
  return text.length > 1000 ? text.slice(0, 1000) + '...' : text;
}

/**
 * テキストからURL用のIDを生成
 * 
 * @param text - テキスト
 * @returns URL用のID
 */
function generateId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 特殊文字を削除
    .replace(/\s+/g, '-') // スペースをハイフンに
    .replace(/-+/g, '-') // 連続するハイフンを1つに
    .replace(/^-|-$/g, ''); // 先頭・末尾のハイフンを削除
}

/**
 * Markdownから目次（Table of Contents）を抽出
 * 
 * @param markdown - Markdownコンテンツ
 * @returns 目次アイテムの配列
 */
export function extractTableOfContents(markdown: string): TableOfContentsItem[] {
  if (!markdown) return [];
  
  const toc: TableOfContentsItem[] = [];
  const lines = markdown.split('\n');
  
  for (const line of lines) {
    // 見出し行を検出（# で始まる行）
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length; // #の数がレベル
      let text = headingMatch[2].trim();
      
      // リンク記号を削除（[テキスト](URL) → テキスト）
      text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      
      // 強調記号を削除
      text = text.replace(/\*\*([^\*]+)\*\*/g, '$1');
      text = text.replace(/\*([^\*]+)\*/g, '$1');
      text = text.replace(/__([^_]+)__/g, '$1');
      text = text.replace(/_([^_]+)_/g, '$1');
      
      // コード記号を削除
      text = text.replace(/`([^`]+)`/g, '$1');
      
      // HTMLタグを削除
      text = text.replace(/<[^>]+>/g, '');
      
      // 空でない場合のみ追加
      if (text.trim()) {
        const id = generateId(text);
        toc.push({
          id,
          level,
          text: text.trim(),
        });
      }
    }
  }
  
  return toc;
}

