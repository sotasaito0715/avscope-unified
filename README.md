# AV Scope Mix（試験）

FANZA（AV Scope）と DUGA（AV Scope DUGA）のカタログを、同じ検索 UI に載せた試験リポジトリです。

- 本番の `www.avscope.jp` / `shiroto.avscope.jp` は変更しません
- 検索エンジンには `noindex`（カニバリ防止）
- 商品 URL は ASP ごとに分離（FANZA: `/item/{cid}`、DUGA: `/duga/item/{cid}`）

## できること

- トップ: FANZA ランキング + DUGA 人気作品
- 検索: タブ（すべて / FANZA / DUGA）
- DUGA 詳細: `/duga` と `/duga/item/{id}`
- CTA は ASP ごとに出し分け（FANZA は FANZA、DUGA は DUGA）

## 環境変数

Vercel の `av-scope` 本番から DMM 認証をコピーします。
DUGA の `DUGA_APP_IDS` などは Vercel 上で Sensitive のため CLI では読めません。
未設定時は `https://shiroto.avscope.jp` の API を経由します。

```
DMM_API_ID=
DMM_AFFILIATE_ID=
DMM_SITE=FANZA
DMM_SERVICE=digital
DMM_FLOOR=videoa
DUGA_APP_IDS=
DUGA_AGENT_ID=
DUGA_BANNER_ID=01
DUGA_API_VERSION=1.2
DUGA_PROXY_ORIGIN=https://shiroto.avscope.jp
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_GA_ENABLED=false
```

## 開発

```bash
npm ci
npm run dev
```
