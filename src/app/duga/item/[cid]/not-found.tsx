import Link from '@/components/ui/Link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center p-8 bg-[#1a1a1a] rounded-lg shadow-lg">
          <h1 className="text-6xl font-bold text-red-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-100 mb-2">商品が見つかりませんでした</h2>
          <p className="text-gray-400 mb-6">
            お探しの DUGA 作品は存在しないか、取得できませんでした。
          </p>
          <Link
            href="/duga"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
          >
            DUGA 一覧へ戻る
          </Link>
        </div>
      </main>
    </>
  );
}
