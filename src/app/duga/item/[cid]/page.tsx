import { cache } from 'react';
import { fetchItemDetailFromDuga } from '@/lib/duga-client';
import Header from '@/components/Header';
import { notFound } from 'next/navigation';
import ItemDetailWithRelatedVideos from '@/components/ItemDetailWithRelatedVideos';
import Breadcrumbs from '@/components/Breadcrumbs';
import { normalizePriceToNumber } from '@/lib/price-utils';
import { Metadata } from 'next';

export const revalidate = 604800;

export async function generateStaticParams() {
  return [];
}

export const dynamicParams = true;

const getItemDetail = cache(async (cid: string) => {
  return fetchItemDetailFromDuga(cid);
});

interface ItemPageProps {
  params: Promise<{
    cid: string;
  }>;
}

export async function generateMetadata({ params }: ItemPageProps): Promise<Metadata> {
  const { cid } = await params;
  const item = await getItemDetail(cid);
  if (!item) {
    return { title: '作品が見つかりません', robots: { index: false, follow: false } };
  }
  return {
    title: item.title,
    description: item.title,
    robots: { index: false, follow: false },
  };
}

export default async function DugaItemPage({ params }: ItemPageProps) {
  const { cid } = await params;
  const item = await getItemDetail(cid);

  if (!item) {
    notFound();
  }

  const priceValue = normalizePriceToNumber(item.prices?.price);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: 'DUGA', href: '/duga' },
              { label: item.title, href: `/duga/item/${cid}` },
            ]}
          />
        </div>
        <ItemDetailWithRelatedVideos
          item={item}
          priceValue={priceValue}
          pageType="item"
        />
      </main>
    </>
  );
}
