import Script from 'next/script';
import type { Metadata } from 'next';
import React from 'react';
import Header from '@/components/Header';
import RandomAd from '@/components/RandomAd';

export const metadata: Metadata = {
  title: '無修正を見る',
  description: '無修正作品への案内ページです。',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function UnsensoredPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
          <h1 className="text-2xl font-bold text-gray-100 text-center">無修正を見る</h1>
        </div>
        {/* モバイル表示 */}
        <div className="lg:hidden max-w-7xl mx-auto px-4 py-6">
          {/* 上部メッセージ */}
          <div className="mb-4 text-center">
            <p className="text-gray-300 text-sm">
              縦スワイプで動画遷移できます
            </p>
          </div>

          {/* 上部広告（バナー） */}
          <div className="mb-4 flex justify-center">
            <RandomAd 
              placement="banner"
              className="w-full max-w-md"
            />
          </div>

          {/* 中央ウィジェット */}
          <div className="flex justify-center">
            <Script
              src="https://www.jpornmarket.com/embed.js"
              strategy="afterInteractive"
            />
            {React.createElement('jpornmarket-widget', {
              affid: '239340',
              width: '320',
              height: '570',
              locale: 'ja',
            })}
          </div>

          {/* 下部広告（バナー） */}
          <div className="mt-6 flex justify-center">
            <RandomAd 
              placement="banner"
              className="w-full max-w-md"
            />
          </div>

          {/* モバイル用追加広告 */}
          <div className="mt-6 flex justify-center">
            <RandomAd 
              placement="content"
              size={{ width: 320, height: 100, label: '320x100' }}
            />
          </div>
        </div>

        {/* PC表示 */}
        <div className="hidden lg:block max-w-7xl mx-auto px-4 py-6">
          {/* 上部メッセージ */}
          <div className="mb-4 text-center">
            <p className="text-gray-300 text-sm">
              縦スワイプで動画遷移できます
            </p>
          </div>

          {/* メインコンテンツエリア（左右に広告、中央にウィジェット） */}
          <div className="flex items-center justify-center gap-6">
            {/* 左側広告 */}
            <div>
              <RandomAd 
                placement="sidebar"
                size={{ width: 300, height: 250, label: '300x250' }}
              />
            </div>

            {/* 中央ウィジェット */}
            <div className="flex-shrink-0">
              <Script
                src="https://www.jpornmarket.com/embed.js"
                strategy="afterInteractive"
              />
              {React.createElement('jpornmarket-widget', {
                affid: '239340',
                width: '320',
                height: '570',
                locale: 'ja',
              })}
            </div>

            {/* 右側広告 */}
            <div>
              <RandomAd 
                placement="sidebar"
                size={{ width: 300, height: 250, label: '300x250' }}
              />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

