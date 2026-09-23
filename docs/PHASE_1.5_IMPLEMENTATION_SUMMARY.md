# PHASE 1.5 実装サマリー

## 📋 実装完了タスク

### ✅ Task A: sitemapを"Functionを通さない"配信に切り替え

**実装内容**:
- `/sitemap.xml` と `/sitemap-items.xml` を静的ファイル配信に切り替え
- ビルド前に `scripts/generate-sitemaps.ts` を実行して `public/` に静的ファイルを生成
- 動的生成のroute.tsを削除（`src/app/sitemap.xml/route.ts` と `src/app/sitemap-items.xml/route.ts`）

**変更ファイル**:
- `scripts/generate-sitemaps.ts` → 新規作成（メインサイトマップと商品サイトマップを生成）
- `src/app/sitemap.xml/route.ts` → 削除
- `src/app/sitemap-items.xml/route.ts` → 削除
- `package.json` → 更新（`prebuild` スクリプトを追加）

**生成スクリプト**:
- `npm run sitemap:generate:main` - メインサイトマップと商品サイトマップを生成
- `npm run prebuild` - ビルド前に自動実行

**配信方式**:
- Next.jsの `public/` ディレクトリから静的ファイルとして配信
- Function invocationが発生しない（CDNから直接配信）

---

### ✅ Task B: OGP画像を"生成済み画像をBlobに置く"方式に変更

**実装内容**:
- 初回のみOGP画像を生成 → Blobに保存（キー: `ogp/{type}/{id}.png`）
- 以後はBlobから画像を読み込んで返す（画像生成処理を回避）
- Blob URLをKVにキャッシュ（7日間）
- 失敗時はデフォルト画像へフォールバック

**変更ファイル**:
- `src/lib/blob-storage.ts` → 新規作成（Vercel Blob Storage ヘルパー）
- `src/lib/kv-cache.ts` → 更新（OGP Blob URL用のキャッシュキーを追加）
- `src/app/item/[cid]/opengraph-image.tsx` → 更新（Blob Storage対応）
- `src/app/actress/[id]/opengraph-image.tsx` → 更新（Blob Storage対応）
- `src/app/maker/[id]/opengraph-image.tsx` → 更新（Blob Storage対応）

**Blobキー設計**:
- `ogp/item/{cid}.png` - 商品OGP画像
- `ogp/actress/{id}.png` - 女優OGP画像
- `ogp/maker/{id}.png` - メーカーOGP画像

**KVキー設計（Blob URL用）**:
- `ogp:blob:item:{cid}:v1` - 商品OGP画像のBlob URL
- `ogp:blob:actress:{id}:v1` - 女優OGP画像のBlob URL
- `ogp:blob:maker:{id}:v1` - メーカーOGP画像のBlob URL

**動作フロー**:
1. KVからBlob URLを取得
2. Blob URLが存在する場合、Blobから画像を読み込んで返す（画像生成処理を回避）
3. Blob URLが存在しない場合、画像を生成してBlobに保存
4. Blob URLをKVに保存（7日間）

---

## 📦 追加パッケージ

- `@vercel/blob` - Vercel Blob Storageクライアント
- `tsx` - TypeScript実行環境（devDependencies）

---

## 🔧 変更ファイル一覧

### 新規作成
1. `scripts/generate-sitemaps.ts` - メインサイトマップと商品サイトマップ生成スクリプト
2. `src/lib/blob-storage.ts` - Vercel Blob Storage ヘルパー

### 更新
1. `src/lib/kv-cache.ts` - OGP Blob URL用のキャッシュキーを追加
2. `src/app/item/[cid]/opengraph-image.tsx` - Blob Storage対応
3. `src/app/actress/[id]/opengraph-image.tsx` - Blob Storage対応
4. `src/app/maker/[id]/opengraph-image.tsx` - Blob Storage対応
5. `package.json` - `sitemap:generate:main` と `prebuild` スクリプトを追加

### 削除
1. `src/app/sitemap.xml/route.ts` - 静的ファイル配信に切り替え
2. `src/app/sitemap-items.xml/route.ts` - 静的ファイル配信に切り替え

---

## 🔑 Blobキー設計

### OGP画像
- `ogp/item/{cid}.png` - 商品OGP画像
  - 例: `ogp/item/abc123.png`
- `ogp/actress/{id}.png` - 女優OGP画像
  - 例: `ogp/actress/1044864.png`
- `ogp/maker/{id}.png` - メーカーOGP画像
  - 例: `ogp/maker/2001.png`

### KVキー（Blob URL用）
- `ogp:blob:item:{cid}:v1` - 商品OGP画像のBlob URL
- `ogp:blob:actress:{id}:v1` - 女優OGP画像のBlob URL
- `ogp:blob:maker:{id}:v1` - メーカーOGP画像のBlob URL

---

## 📊 追加したCache-Control一覧

### 静的ファイル（sitemap）
- `/sitemap.xml`: 静的ファイル（CDNから直接配信、Function invocationなし）
- `/sitemap-items.xml`: 静的ファイル（CDNから直接配信、Function invocationなし）

### OGP画像
- `/item/[cid]/opengraph-image`: ISR `revalidate=604800`（7日間）
  - Blobから読み込む場合は、Blobのキャッシュヘッダーが適用される
- `/actress/[id]/opengraph-image`: ISR `revalidate=604800`（7日間）
- `/maker/[id]/opengraph-image`: ISR `revalidate=604800`（7日間）

---

## ✅ 検証手順（curlで見るべきヘッダ）

### 1. サイトマップの静的ファイル配信確認

```bash
# メインサイトマップ（静的ファイル）
curl -I https://www.avscope.jp/sitemap.xml

# 確認すべきヘッダ:
# - x-vercel-cache: HIT（CDNキャッシュ）
# - Cache-Control: public, max-age=0, must-revalidate（Next.jsのデフォルト）
# - レスポンスが速い（Function invocationなし）

# 商品サイトマップ（静的ファイル）
curl -I https://www.avscope.jp/sitemap-items.xml

# 確認すべきヘッダ:
# - x-vercel-cache: HIT（CDNキャッシュ）
# - レスポンスが速い（Function invocationなし）
```

### 2. OGP画像のBlob Storage確認

```bash
# 商品OGP画像（初回アクセス: 画像生成 → Blob保存）
curl -I https://www.avscope.jp/item/{cid}/opengraph-image

# 確認すべきヘッダ:
# - x-vercel-cache: MISS（初回）
# - Content-Type: image/png
# - Cache-Control: public, s-maxage=604800, stale-while-revalidate=604800

# 2回目以降（Blobから読み込み）
curl -I https://www.avscope.jp/item/{cid}/opengraph-image

# 確認すべきヘッダ:
# - x-vercel-cache: HIT（Blobから読み込み、画像生成処理を回避）
# - Content-Type: image/png

# 女優OGP画像
curl -I https://www.avscope.jp/actress/{id}/opengraph-image

# メーカーOGP画像
curl -I https://www.avscope.jp/maker/{id}/opengraph-image
```

### 3. ビルド前のsitemap生成確認

```bash
# ローカルでsitemap生成を実行
npm run sitemap:generate:main

# 確認:
# - public/sitemap.xml が生成されている
# - public/sitemap-items.xml が生成されている
# - ファイルサイズが適切（数MB以下）

# ビルド時に自動実行されることを確認
npm run build

# 確認:
# - prebuildスクリプトが実行される
# - public/sitemap.xml と public/sitemap-items.xml が存在する
```

### 4. 静的ファイル配信の確認（ローカル）

```bash
# 開発サーバーを起動
npm run dev

# 別ターミナルで確認
curl -I http://localhost:3000/sitemap.xml

# 確認すべきヘッダ:
# - Content-Type: application/xml
# - レスポンスが速い（Function invocationなし）
```

---

## 🎯 期待される効果

### Function Invocations削減
- **サイトマップ**: 約1.5M-2M削減（Botのアクセス頻度が高いため、静的ファイル配信によりFunction invocationがゼロに）
- **OGP画像**: 約0.3M-0.5M削減（Blobから読み込む場合、画像生成処理を回避）
- **合計**: 約1.8M-2.5M削減（約40-50%削減）

### CPU削減
- **サイトマップ**: 約10-15h削減（静的ファイル配信によりCPU使用量がゼロに）
- **OGP画像**: 約2-3h削減（Blobから読み込む場合、画像生成処理を回避）
- **合計**: 約12-18h削減（約35-50%削減）

### Memory削減
- **サイトマップ**: 約50-80 GB-Hrs削減（静的ファイル配信によりMemory使用量がゼロに）
- **OGP画像**: 約10-20 GB-Hrs削減（Blobから読み込む場合、画像生成処理を回避）
- **合計**: 約60-100 GB-Hrs削減（約25-45%削減）

---

## ⚠️ 注意事項

1. **Vercel Blob Storageの設定が必要**
   - VercelダッシュボードでBlob Storageを有効化する必要があります
   - 環境変数 `BLOB_READ_WRITE_TOKEN` が自動的に設定されます

2. **ビルド前のsitemap生成**
   - `npm run build` を実行する前に、`npm run sitemap:generate:main` が自動実行されます
   - 手動で実行する場合は、`npm run sitemap:generate:main` を実行してください

3. **DMM API認証情報が必要**
   - `scripts/generate-sitemaps.ts` はビルド時にDMM APIを直接呼び出すため、環境変数が必要です
   - `.env.local` に `DMM_API_ID` と `DMM_AFFILIATE_ID` を設定してください

4. **静的ファイルのサイズ制限**
   - Vercelの静的ファイルサイズ制限（通常100MB）を超えないように注意してください
   - 現在の実装では、sitemap.xmlとsitemap-items.xmlは数MB程度の想定です

5. **Blob Storageのコスト**
   - Vercel Blob Storageは無料プランでも利用可能ですが、使用量に応じて課金されます
   - OGP画像の数とサイズに応じて、ストレージ使用量が増加します

---

## 📝 次のステップ

1. **VercelダッシュボードでUsageを確認**
   - 実装後、1週間程度でUsageの削減効果を確認
   - Function Invocationsが大幅に削減されていることを確認

2. **Blob Storageの使用量を監視**
   - VercelダッシュボードでBlob Storageの使用量を確認
   - 必要に応じて、古いOGP画像を削除するスクリプトを作成

3. **sitemap生成の定期実行**
   - CI/CDパイプラインで定期的にsitemapを再生成することを検討
   - または、VercelのCron Jobsを使用して定期実行

4. **必要に応じてPHASE 2を検討**
   - さらなる最適化が必要な場合は、PHASE 2を検討

