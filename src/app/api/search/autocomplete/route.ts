import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// CDN / Data Cache。TTL は既存の query 側 revalidate と揃え、ASP コールを増やさない
export const revalidate = 3600;

interface Actress {
  id: number;
  name: string;
  ruby: string;
}

interface Genre {
  genre_id: number;
  genre_name: string;
}

interface SearchResult {
  text: string;
  type: 'actress' | 'genre';
  id: number;
  ruby?: string;
}

// モジュールレベルのキャッシュ（メモリに保持）
let actressesCache: Actress[] | null = null;
let genresCache: Genre[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 3600000; // 1時間（ミリ秒）

/**
 * JSONファイルを読み込み、メモリキャッシュを活用
 */
async function loadData(): Promise<{ actresses: Actress[]; genres: Genre[] }> {
  const now = Date.now();

  // キャッシュが有効な場合は再利用
  if (actressesCache && genresCache && (now - cacheTimestamp) < CACHE_TTL) {
    return { actresses: actressesCache, genres: genresCache };
  }

  // キャッシュが無効または存在しない場合は読み込む
  const actressesPath = join(process.cwd(), 'data', 'actress', 'actresses_summary.json');
  const genresPath = join(process.cwd(), 'data', 'genres', 'genres_summary.json');

  const [actressesData, genresData] = await Promise.all([
    readFile(actressesPath, 'utf-8').then(JSON.parse) as Promise<Actress[]>,
    readFile(genresPath, 'utf-8').then(JSON.parse) as Promise<Genre[]>,
  ]);

  // キャッシュを更新
  actressesCache = actressesData;
  genresCache = genresData;
  cacheTimestamp = now;

  return { actresses: actressesData, genres: genresData };
}

/**
 * 検索補助用APIエンドポイント
 * 女優とジャンルのJSONファイルを読み込み、キーワードで検索を実行
 * 
 * クエリパラメータ:
 * - keyword: 検索キーワード（必須）
 * - maxResults: 最大結果数（デフォルト: 10）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const keyword = searchParams.get('keyword') || '';
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10);

    if (!keyword.trim()) {
      return NextResponse.json(
        { results: [] },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1時間キャッシュ
          },
        }
      );
    }

    // メモリキャッシュからデータを取得（初回のみファイル読み込み）
    const { actresses: actressesData, genres: genresData } = await loadData();

    const normalizedKeyword = keyword.toLowerCase().trim();
    const results: SearchResult[] = [];

    // 女優検索（名前と読みで検索）
    const actressMatches = actressesData
      .filter(
        (actress) =>
          actress.name.toLowerCase().includes(normalizedKeyword) ||
          actress.ruby.toLowerCase().includes(normalizedKeyword)
      )
      .slice(0, Math.floor(maxResults / 2))
      .map((actress) => ({
        text: actress.name,
        type: 'actress' as const,
        id: actress.id,
        ruby: actress.ruby,
      }));

    results.push(...actressMatches);

    // ジャンル検索
    const genreMatches = genresData
      .filter((genre) =>
        genre.genre_name.toLowerCase().includes(normalizedKeyword)
      )
      .slice(0, maxResults - actressMatches.length)
      .map((genre) => ({
        text: genre.genre_name,
        type: 'genre' as const,
        id: genre.genre_id,
      }));

    results.push(...genreMatches);

    return NextResponse.json(
      { results: results.slice(0, maxResults) },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200', // 1時間キャッシュ
        },
      }
    );
  } catch (error) {
    console.error('Search autocomplete API Error:', error);
    return NextResponse.json(
      { error: '検索に失敗しました', results: [] },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store', // エラー時はキャッシュしない
        },
      }
    );
  }
}

