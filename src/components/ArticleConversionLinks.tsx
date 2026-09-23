import Link from '@/components/ui/Link';

type ArticleConversionLinksProps = {
  itemIds?: string[];
};

export default function ArticleConversionLinks({ itemIds = [] }: ArticleConversionLinksProps) {
  const uniqueIds = Array.from(new Set(itemIds.filter(Boolean))).slice(0, 5);

  return (
    <section aria-labelledby="conversion-links" className="mt-12 rounded-lg border border-[#333333] bg-[#121212] p-5">
      <h2 id="conversion-links" className="text-xl font-bold text-gray-100 mb-3">
        この記事の作品を見る
      </h2>
      {uniqueIds.length > 0 ? (
        <ul className="space-y-2">
          {uniqueIds.map((cid) => (
            <li key={cid} className="flex flex-wrap gap-3">
              <Link
                href={`/item/${cid}`}
                className="text-red-400 hover:text-red-300 hover:underline transition-colors"
              >
                作品詳細
              </Link>
              <Link
                href={`/video/item/${cid}`}
                prefetch={false}
                className="text-red-400 hover:text-red-300 hover:underline transition-colors"
              >
                無料動画を再生
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400 mb-3">
          作品ページからサンプルを見て、フル動画を見ることができます。
        </p>
      )}
      <ul className="mt-4 space-y-2 border-t border-[#333333] pt-4">
        <li>
          <Link href="/rankings" className="text-gray-400 hover:text-red-300 hover:underline transition-colors">
            人気AVランキングTOPを見る
          </Link>
        </li>
        <li>
          <Link href="/actresses" className="text-gray-400 hover:text-red-300 hover:underline transition-colors">
            女優別おすすめ作品を探す
          </Link>
        </li>
        <li>
          <Link href="/genre" className="text-gray-400 hover:text-red-300 hover:underline transition-colors">
            ジャンル別おすすめ作品を探す
          </Link>
        </li>
      </ul>
    </section>
  );
}
