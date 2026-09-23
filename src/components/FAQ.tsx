'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: 'AV Scopeとは何ですか？',
    answer: 'AV Scopeは、DMMのAV作品検索サイトです。人気ランキング、女優検索、キーワード検索で簡単にお気に入りの作品を見つけられます。'
  },
  {
    question: '女優検索の使い方は？',
    answer: 'ヘッダーの「女優検索」ボタンをクリックすると、バスト・ウエスト・ヒップ・身長・生年月日などの詳細条件で女優を検索できます。条件を絞り込んで理想の女優を見つけましょう。'
  },
  {
    question: '作品の検索方法は？',
    answer: 'ヘッダーの検索ボックスにキーワードを入力して検索ボタンをクリックしてください。女優名、作品タイトル、ジャンルなどで検索できます。'
  },
  {
    question: '動画は見られますか？',
    answer: 'はい、各作品の詳細ページで無料動画を視聴できます。'
  },
  {
    question: 'スマホでも使えますか？',
    answer: 'はい、AV Scopeは完全にレスポンシブ対応しています。PC、スマートフォン、タブレットなど、あらゆるデバイスで快適にご利用いただけます。'
  },
  {
    question: '新作はどこで確認できますか？',
    answer: 'トップページに最新の人気作品が表示されます。また、検索で「新作」などのキーワードを使用することで、最近リリースされた作品を見つけることができます。'
  },
  {
    question: 'レビュー・評価は参考にできますか？',
    answer: 'はい、各作品には DMM公式サイトのユーザーレビューと平均評価が表示されています。購入前の参考にしてください。'
  },
];

/**
 * FAQコンポーネント
 * 
 * @description
 * よくある質問とその回答を表示します。
 * JSON-LD構造化データも出力してリッチスニペット表示を実現します。
 */
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // JSON-LD構造化データ
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqData.map((item) => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer,
      },
    })),
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* FAQ UI */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-100 mb-8 text-center">
          よくある質問
        </h2>

        <div className="space-y-4">
          {faqData.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden"
              >
                {/* 質問 */}
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-[#252525] transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-gray-100 font-medium pr-4">
                    Q. {item.question}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* 回答 */}
                {isOpen && (
                  <div className="px-6 pb-4 pt-2 text-gray-400 border-t border-[#333333]">
                    <p className="leading-relaxed">A. {item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

