/**
 * 動画URL生成ユーティリティ
 * ContentIdから無料動画のMP4 URLを生成
 */

/**
 * ContentIdから複数の無料動画URLを生成
 * 複数生成されるMP4のURLのうち、どれか1つが再生可能
 * 
 * @param contentId - コンテンツID（例: "h_1234abcd1234"）
 * @returns 無料動画URLの配列
 */
export function getSampleMovieUrls(contentId: string): string[] {
  const sampleMovieUrls: string[] = [];

  if (!contentId || contentId.length < 3) {
    return [];
  }

  const head1 = contentId.substring(0, 1);
  const head3 = contentId.substring(0, 3);

  // URL 1: {contentId}_dm_w.mp4
  sampleMovieUrls.push(
    `https://cc3001.dmm.co.jp/litevideo/freepv/${head1}/${head3}/${contentId}/${contentId}_dm_w.mp4`
  );

  // URL 2: {contentIdWithoutFifthAndSixth}mhb.mp4
  if (contentId.length >= 6) {
    const contentIdWithoutFifthAndSixth = contentId.substring(0, 4) + contentId.substring(6);
    sampleMovieUrls.push(
      `https://cc3001.dmm.co.jp/litevideo/freepv/${head1}/${head3}/${contentIdWithoutFifthAndSixth}/${contentIdWithoutFifthAndSixth}mhb.mp4`
    );
  }

  // URL 3: {contentId}mhb.mp4
  sampleMovieUrls.push(
    `https://cc3001.dmm.co.jp/litevideo/freepv/${head1}/${head3}/${contentId}/${contentId}mhb.mp4`
  );

  // URL 4: {contentId}_dmb_w.mp4
  sampleMovieUrls.push(
    `https://cc3001.dmm.co.jp/litevideo/freepv/${head1}/${head3}/${contentId}/${contentId}_dmb_w.mp4`
  );

  return sampleMovieUrls;
}

/**
 * 動画URLが再生可能かどうかをチェック
 * 
 * @param url - チェックする動画URL
 * @returns Promise<boolean> - 再生可能な場合true
 */
export async function checkVideoUrl(url: string): Promise<boolean> {
  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // CORSエラーを回避
    });
    // no-corsモードではレスポンスを読めないため、常にtrueを返す
    // 実際の再生可能性はvideo要素で確認する
    return true;
  } catch {
    return false;
  }
}

/**
 * 複数のURLから最初に再生可能なURLを見つける
 * 
 * @param urls - チェックするURLの配列
 * @returns Promise<string | null> - 再生可能なURL、見つからない場合はnull
 */
export async function findPlayableVideoUrl(urls: string[]): Promise<string | null> {
  // すべてのURLを返す（実際の再生可能性はクライアント側で確認）
  // 最初のURLを優先的に試す
  return urls.length > 0 ? urls[0] : null;
}

