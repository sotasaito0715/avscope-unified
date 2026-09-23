#!/usr/bin/env node
/**
 * IndexNow: Bing / Yandex 等へ URL を即通知する。
 * 失敗してもデプロイは止めない。
 */

const KEY = '686c542f88bda4514bdc1b08bd374434';
const HOST = 'www.avscope.jp';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

async function submit(urls) {
  const unique = Array.from(new Set(urls.filter(Boolean))).slice(0, 10000);
  if (unique.length === 0) {
    console.log('IndexNow: no URLs to submit');
    return;
  }

  const response = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList: unique,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn(`IndexNow failed: ${response.status} ${body.slice(0, 300)}`);
    return;
  }

  console.log(`IndexNow submitted ${unique.length} URLs`);
}

const args = process.argv.slice(2);
const urls = args.length > 0 ? args : [`https://${HOST}/sitemap.xml`];
submit(urls).catch((error) => {
  console.warn('IndexNow error:', error);
});
