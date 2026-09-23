import { Metadata } from 'next';
import FavoritesPageContent from '@/components/FavoritesPageContent';

// SEO: 共有お気に入りページはnoindexに設定
export const metadata: Metadata = {
  title: '共有されたお気に入り',
  description: '共有されたお気に入りリストを表示します。',
  alternates: {
    canonical: 'https://www.avscope.jp/favorites',
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
    },
  },
};

export default function FavoritesPage() {
  return <FavoritesPageContent />;
}
