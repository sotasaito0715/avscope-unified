/**
 * アプリケーション共通スタイル定数
 * 
 * @description
 * Tailwind CSSクラスの組み合わせを定数化し、
 * スタイルの一貫性と保守性を向上させます。
 */

// ============================================
// フォーム要素
// ============================================

export const FORM_STYLES = {
  // 入力フィールド
  input: "w-full px-4 py-2 bg-[#0a0a0a] text-gray-100 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500",
  inputSmall: "px-3 py-2 bg-[#0a0a0a] text-gray-100 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500",
  
  // セレクトボックス
  select: "w-full px-4 py-2 bg-[#0a0a0a] text-gray-100 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 appearance-none cursor-pointer",
  
  // チェックボックス
  checkbox: "w-3 h-3 text-red-600 bg-[#1a1a1a] border-[#333333] rounded focus:ring-red-500",
  checkboxLabel: "flex items-center gap-1 text-xs text-gray-400 cursor-pointer",
  
  // レンジスライダー
  slider: "w-full h-2 bg-[#252525] rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-30 disabled:cursor-not-allowed",
  
  // ラベル
  label: {
    main: "block text-sm font-medium text-gray-300 mb-2",
    large: "block text-sm font-medium text-gray-300 mb-3",
    small: "text-xs text-gray-500",
  },
  
  // 日付入力
  date: "flex-1 px-3 py-2 bg-[#1a1a1a] text-gray-100 border border-[#333333] rounded-md focus:outline-none focus:ring-2 focus:ring-red-500",
} as const;

// ============================================
// ボタン
// ============================================

export const BUTTON_STYLES = {
  // プライマリボタン（赤）
  primary: "px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  primaryFull: "w-full px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
  primaryWithOffset: "px-6 py-3 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]",
  
  // セカンダリボタン（グレー）
  secondary: "px-6 py-3 bg-[#252525] text-gray-300 font-medium rounded-md hover:bg-[#303030] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2",
  secondaryWithOffset: "px-6 py-3 bg-[#252525] text-gray-300 font-medium rounded-md hover:bg-[#303030] transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]",
  
  // テキストボタン
  text: "text-blue-400 hover:text-blue-300 transition-colors",
  textWithIcon: "flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors",
  
  // アイコンボタン
  icon: "p-2 rounded-md hover:bg-[#252525] transition-colors",
  
  // 小さいボタン
  small: "px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors",
} as const;

// ============================================
// カード
// ============================================

export const CARD_STYLES = {
  // ベースカード
  base: "bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden",
  baseWithHover: "bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:bg-[#252525] transition-all duration-200",
  
  // カードコンテンツ
  content: "p-4",
  contentSmall: "p-3",
  contentLarge: "p-6",
  
  // カードヘッダー
  header: "px-4 py-3 border-b border-[#333333]",
  
  // カードフッター
  footer: "px-4 py-3 border-t border-[#333333]",
} as const;

// ============================================
// レイアウト
// ============================================

export const LAYOUT_STYLES = {
  // コンテナ
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  containerWithPadding: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  
  // グリッド
  grid: {
    items: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4",
    actresses: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4",
  },
  
  // Flexbox
  flex: {
    between: "flex items-center justify-between",
    center: "flex items-center justify-center",
    start: "flex items-start",
    gap: "flex items-center gap-2",
  },
} as const;

// ============================================
// テキスト
// ============================================

export const TEXT_STYLES = {
  // ヘッディング
  h1: "text-3xl font-bold text-gray-100",
  h2: "text-2xl font-bold text-gray-100",
  h3: "text-xl font-semibold text-gray-100",
  
  // 段落
  p: "text-gray-400",
  pSmall: "text-sm text-gray-400",
  pXSmall: "text-xs text-gray-500",
  
  // リンク
  link: "text-blue-400 hover:text-blue-300 hover:underline transition-colors",
  linkSubtle: "text-gray-400 hover:text-gray-100 transition-colors",
  
  // エラー
  error: "text-red-400",
  
  // 成功
  success: "text-green-400",
  
  // 警告
  warning: "text-yellow-400",
} as const;

// ============================================
// バッジ・タグ
// ============================================

export const BADGE_STYLES = {
  default: "inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-[#252525] text-gray-300",
  primary: "inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-red-600 text-white",
  secondary: "inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-blue-600 text-white",
  success: "inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-green-600 text-white",
  warning: "inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-yellow-600 text-white",
} as const;

// ============================================
// モーダル・オーバーレイ
// ============================================

export const MODAL_STYLES = {
  overlay: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50",
  container: "relative bg-[#1a1a1a] rounded-lg shadow-xl max-w-4xl w-full mx-4",
  header: "flex items-center justify-between p-4 border-b border-[#333333]",
  content: "p-6",
  footer: "flex items-center justify-end gap-4 p-4 border-t border-[#333333]",
  closeButton: "absolute top-4 right-4 text-gray-400 hover:text-white transition-colors",
} as const;

// ============================================
// アニメーション
// ============================================

export const ANIMATION_STYLES = {
  fadeIn: "animate-fade-in",
  slideIn: "animate-slide-in",
  spin: "animate-spin",
  pulse: "animate-pulse",
  bounce: "animate-bounce",
} as const;

// ============================================
// スクロール
// ============================================

export const SCROLL_STYLES = {
  // カスタムスクロールバー
  customScrollbar: "scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800",
  
  // 横スクロール
  horizontalScroll: "overflow-x-auto pb-4",
  horizontalScrollWithCustombar: "overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800",
} as const;

// ============================================
// ユーティリティ
// ============================================

export const UTILITY_STYLES = {
  // トランジション
  transition: "transition-all duration-200",
  transitionColors: "transition-colors duration-200",
  
  // 切り捨て
  truncate: "truncate",
  lineClamp2: "line-clamp-2",
  lineClamp3: "line-clamp-3",
  
  // 影
  shadow: "shadow-md",
  shadowLg: "shadow-lg",
  
  // 境界線
  border: "border border-[#333333]",
  borderBottom: "border-b border-[#333333]",
  borderTop: "border-t border-[#333333]",
} as const;

