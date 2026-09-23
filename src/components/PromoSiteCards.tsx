import DoujinSiteCard from './DoujinSiteCard';
import ShirotoSiteCard from './ShirotoSiteCard';

/**
 * 一覧先頭に並べる姉妹サイト誘導カード
 */
export default function PromoSiteCards() {
  return (
    <>
      <DoujinSiteCard />
      <ShirotoSiteCard />
    </>
  );
}
