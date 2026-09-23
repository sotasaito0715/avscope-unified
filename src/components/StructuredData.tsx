/**
 * 構造化データコンポーネント
 * 
 * @description
 * WebSiteとOrganizationのJSON-LD構造化データを出力します。
 * これにより、Googleの検索結果でサイト内検索ボックスが表示され、
 * ブランド情報が正しく認識されます。
 */
export default function StructuredData() {
  // WebSite構造化データ（サイト内検索ボックス）
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'AV Scope',
    'alternateName': 'AVスコープ',
    'url': 'https://www.avscope.jp',
    'description': '人気AVランキング・女優検索・ジャンル別一覧で作品を探せるAV Scope。無料動画の縦スワイプ視聴にも対応。',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': 'https://www.avscope.jp/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // Organization構造化データ（サイト運営者情報）
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'AV Scope',
    'alternateName': 'AVスコープ',
    'url': 'https://www.avscope.jp',
    'logo': {
      '@type': 'ImageObject',
      'url': 'https://www.avscope.jp/logo.png',
      'width': 512,
      'height': 512,
    },
    'description': '人気AVランキング・女優検索・ジャンル別一覧で作品を探せるAV Scope。',
    'sameAs': [
      'https://twitter.com/av_scope',
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'availableLanguage': 'Japanese',
    },
  };

  return (
    <>
      {/* WebSite構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {/* Organization構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
    </>
  );
}

