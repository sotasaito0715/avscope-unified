/**
 * 画像最適化ユーティリティ
 */

// ============================================
// Blur Placeholder
// ============================================

/**
 * シンプルなblur data URLを生成
 */
export function getBlurDataURL(width = 10, height = 10): string {
  const canvas = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#1a1a1a"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`;
}

/**
 * グラデーションblur data URLを生成
 */
export function getGradientBlurDataURL(): string {
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0a0a0a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" fill="url(#grad)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * カラフルなblur data URLを生成（商品用）
 */
export function getItemBlurDataURL(): string {
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad">
          <stop offset="0%" style="stop-color:#2d2d2d;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="40" height="40" fill="url(#grad)"/>
      <circle cx="20" cy="20" r="10" fill="#1a1a1a" opacity="0.5"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * 女優画像用のblur data URLを生成
 */
export function getActressBlurDataURL(): string {
  const svg = `
    <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad">
          <stop offset="0%" style="stop-color:#252525;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
        </radialGradient>
      </defs>
      <circle cx="20" cy="20" r="20" fill="url(#grad)"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// ============================================
// 画像サイズ計算
// ============================================

/**
 * レスポンシブ画像のsizes属性を生成
 */
export function getResponsiveSizes(type: 'item' | 'actress' | 'detail'): string {
  switch (type) {
    case 'item':
      // グリッド表示用
      return '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw';
    case 'actress':
      // 女優カード用
      return '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 16vw, 160px';
    case 'detail':
      // 詳細ページ用
      return '(max-width: 1024px) 100vw, 50vw';
    default:
      return '100vw';
  }
}

/**
 * 画像の優先度を判定
 */
export function shouldPrioritize(index: number, type: 'list' | 'detail' = 'list'): boolean {
  if (type === 'detail') return true;
  return index < 4; // リスト表示の最初の4枚のみ優先読み込み
}

// ============================================
// 画像URL処理
// ============================================

/**
 * 画像URLのフォールバック処理（直接URL使用、キャッシュ無効化）
 */
export function getOptimizedImageUrl(
  imageUrl: { large?: string; list?: string; small?: string } | undefined,
  preferredSize: 'large' | 'list' | 'small' = 'large'
): string {
  if (!imageUrl) return '/placeholder.jpg';
  
  // 直接URLを返す（Next.js画像最適化を無効化）
  const url = imageUrl[preferredSize] || imageUrl.large || imageUrl.list || imageUrl.small || '/placeholder.jpg';
  
  return url;
}

/**
 * 画像品質を取得（デバイスに応じて）
 */
export function getImageQuality(type: 'thumbnail' | 'full' = 'thumbnail'): number {
  return type === 'thumbnail' ? 80 : 90;
}

