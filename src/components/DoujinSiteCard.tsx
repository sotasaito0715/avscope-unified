/**
 * 同人サイト紹介カードコンポーネント
 * 
 * @description
 * ItemCardと同じスタイルで同人サイトへのリンクを表示します。
 * アイテム一覧の最初に表示されます。
 */
export default function DoujinSiteCard() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:bg-[#252525] transition-all duration-200">
      <a
        href="https://www.doujinonline.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative aspect-[3/2] cursor-pointer bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <div className="text-center p-4">
            <h3 className="text-white font-bold text-lg mb-2">
              同人サイト
            </h3>
            <p className="text-white text-sm opacity-90">
              www.doujinonline.com
            </p>
          </div>
        </div>
      </a>
      
      <div className="p-4">
        <a
          href="https://www.doujinonline.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem] text-gray-100 hover:text-blue-400 transition-colors cursor-pointer">
            同人作品を楽しめるサイト
          </h3>
        </a>
        
        <p className="text-xs mb-2 min-h-[1.25rem]">
          <span className="text-gray-400">おすすめサイト</span>
        </p>
        
        <div className="space-y-2">
          <a
            href="https://www.doujinonline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-red-600 text-white px-3 py-2 rounded text-xs hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            サイトを見る
          </a>
        </div>
      </div>
    </div>
  );
}
