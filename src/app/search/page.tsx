import { Metadata } from 'next';
import SearchPageContent from '@/components/SearchPageContent';

// SEO: 検索結果ページはnoindexに設定
export const metadata: Metadata = {
  title: '検索',
  description: 'FANZA と DUGA の作品をキーワードで横断検索。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SearchPage() {
  return <SearchPageContent />;
}
