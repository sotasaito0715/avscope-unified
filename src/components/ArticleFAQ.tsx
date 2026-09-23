/**
 * 記事ページ用 FAQ（アコーディオン）
 *
 * @description
 * Frontmatter の faq を本文末尾に表示する。
 * details/summary で回答を HTML に含め、SEO・アクセシビリティを確保する。
 */

interface ArticleFAQProps {
  items: Array<{
    q: string;
    a: string;
  }>;
}

export default function ArticleFAQ({ items }: ArticleFAQProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <section className="mt-12 pt-8 border-t border-[#333333]" aria-labelledby="article-faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <h2 id="article-faq-heading" className="text-2xl font-bold text-gray-100 mb-6">
        よくある質問
      </h2>
      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={`${index}-${item.q}`}
            className="group bg-[#121212] border border-[#333333] rounded-lg overflow-hidden"
          >
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4 hover:bg-[#1f1f1f] transition-colors [&::-webkit-details-marker]:hidden">
              <span className="text-gray-100 font-medium">
                Q. {item.q}
              </span>
              <svg
                className="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="px-5 pb-4 pt-1 text-gray-400 border-t border-[#333333]">
              <p className="leading-relaxed whitespace-pre-wrap">A. {item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
