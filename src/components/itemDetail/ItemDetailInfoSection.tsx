'use client';

import Link from '@/components/ui/Link';
import { DMMItem } from '@/types/dmm';
import { formatDate } from '@/lib/date-utils';

interface ItemDetailInfoSectionProps {
  item: DMMItem;
}

export default function ItemDetailInfoSection({ item }: ItemDetailInfoSectionProps) {
  return (
    <section className="bg-[#1a1a1a] rounded-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-100 border-b border-[#333333] pb-2">
        基本情報
      </h2>
      
      <dl className="space-y-3 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <dt className="text-gray-400">商品ID:</dt>
          <dd className="text-gray-100 col-span-2" itemProp="sku">{item.content_id}</dd>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          <dt className="text-gray-400">発売日:</dt>
          <dd className="text-gray-100 col-span-2">
            <time dateTime={item.date} itemProp="releaseDate">
              {formatDate(item.date, 'long')}
            </time>
          </dd>
        </div>
        
        {item.volume && (
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-400">収録時間:</dt>
            <dd className="text-gray-100 col-span-2">
              <meta itemProp="duration" content={`PT${item.volume}M`} />
              {item.volume}分
            </dd>
          </div>
        )}

        {item.iteminfo?.maker && item.iteminfo.maker.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-400">メーカー:</dt>
            <dd className="col-span-2" itemProp="brand" itemScope itemType="https://schema.org/Brand">
              <Link
                href={`/maker/${item.iteminfo.maker[0].id}`}
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                itemProp="name"
              >
                {item.iteminfo.maker[0].name}
              </Link>
            </dd>
          </div>
        )}

        {item.iteminfo?.label && item.iteminfo.label.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-400">レーベル:</dt>
            <dd className="text-gray-100 col-span-2">{item.iteminfo.label[0].name}</dd>
          </div>
        )}

        {item.iteminfo?.series && item.iteminfo.series.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-400">シリーズ:</dt>
            <dd className="col-span-2">
              <Link
                href={`/series/${item.iteminfo.series[0].id}`}
                className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
              >
                {item.iteminfo.series[0].name}
              </Link>
            </dd>
          </div>
        )}

        {item.iteminfo?.director && item.iteminfo.director.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            <dt className="text-gray-400">監督:</dt>
            <dd className="text-gray-100 col-span-2" itemProp="director" itemScope itemType="https://schema.org/Person">
              <span itemProp="name">{item.iteminfo.director[0].name}</span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}


