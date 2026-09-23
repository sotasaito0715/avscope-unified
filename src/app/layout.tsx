import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import AnalyticsPageView from "@/components/AnalyticsPageView";
import StructuredData from "@/components/StructuredData";
import SkipLink from "@/components/SkipLink";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap', // フォント読み込み最適化（FOITを防ぐ）
  preload: false, // プリロード警告を回避（フォントは実際に使用されているため問題なし）
  fallback: ['Arial', 'Helvetica', 'sans-serif'], // フォールバックフォント
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap', // フォント読み込み最適化（FOITを防ぐ）
  preload: false, // プリロード警告を回避（フォントは実際に使用されているため問題なし）
  fallback: ['monospace'], // フォールバックフォント
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://avscope-unified.vercel.app'),
  title: {
    default: "AV Scope Mix - FANZAとDUGAを横断検索",
    template: "%s | AV Scope Mix",
  },
  description: "FANZA と DUGA の作品を一つのサイトで探す試験カタログ。本番の avscope.jp とは別の実験環境です。",
  keywords: ["AV", "AV Scope", "FANZA", "DUGA", "検索"],
  authors: [{ name: "AV Scope Mix" }],
  creator: "AV Scope Mix",
  publisher: "AV Scope Mix",
  openGraph: {
    title: "AV Scope Mix - FANZAとDUGAを横断検索",
    description: "FANZA と DUGA の作品を一つのサイトで探す試験カタログ。",
    type: "website",
    locale: "ja_JP",
    siteName: "AV Scope Mix",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AV Scope Mix",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AV Scope Mix - FANZAとDUGAを横断検索",
    description: "FANZA と DUGA の作品を一つのサイトで探す試験カタログ。",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  category: 'entertainment',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Favicon設定 */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.svg" />
        <link rel="icon" href="/favicon-16x16.svg" sizes="16x16" type="image/svg+xml" />
        <link rel="icon" href="/favicon-32x32.svg" sizes="32x32" type="image/svg+xml" />
        <link rel="icon" href="/favicon-48x48.svg" sizes="48x48" type="image/svg+xml" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* 試験サイトのため本番ドメインの hreflang は付けない */}
        
        {/* テーマカラー */}
        <meta name="theme-color" content="#1a1a1a" />
        <meta name="msapplication-TileColor" content="#1a1a1a" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* スキップリンク */}
        <SkipLink />
        
        {/* Google Analytics */}
        <GoogleAnalytics />
        
        {/* ページビュートラッキング（App Router対応） */}
        <AnalyticsPageView />
        
        {/* WebSite & Organization構造化データ */}
        <StructuredData />
        
        {/* パフォーマンス監視 */}
        
        {children}
      </body>
    </html>
  );
}
