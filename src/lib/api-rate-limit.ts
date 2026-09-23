/**
 * APIレート制限ユーティリティ
 * 同時実行数を制限して、外部APIへのアクセス数を制御
 */

interface RateLimitOptions {
  maxConcurrency: number; // 同時実行数の上限
  delay?: number; // 各リクエスト間の遅延（ミリ秒）
}

/**
 * 複数の非同期処理を並列実行しながら、同時実行数を制限
 */
export async function rateLimitedPromiseAll<T>(
  tasks: (() => Promise<T>)[],
  options: RateLimitOptions
): Promise<T[]> {
  const { maxConcurrency, delay = 0 } = options;
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    // 同時実行数が上限に達している場合は待機
    if (executing.length >= maxConcurrency) {
      await Promise.race(executing);
    }

    // 新しいタスクを開始
    const promise = task().then((result) => {
      results.push(result);
      executing.splice(executing.indexOf(promise), 1);
    });

    executing.push(promise);

    // 遅延を追加（オプション）
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // 残りのタスクが完了するまで待機
  await Promise.all(executing);

  return results;
}

/**
 * バッチ処理でリクエストを分割して実行
 * 各バッチの間に遅延を追加
 */
export async function batchProcess<T>(
  tasks: (() => Promise<T>)[],
  batchSize: number,
  delayBetweenBatches: number = 1000
): Promise<T[]> {
  const results: T[] = [];

  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(task => task()));
    results.push(...batchResults);

    // 最後のバッチでなければ遅延を追加
    if (i + batchSize < tasks.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}

