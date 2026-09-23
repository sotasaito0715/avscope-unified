import Link from '@/components/ui/Link';
import Header from '@/components/Header';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-100 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-300 mb-4">
              女優が見つかりません
            </h2>
            <p className="text-gray-400 mb-8">
              指定された女優の情報が見つかりませんでした。
            </p>
            <Link
              href="/"
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

