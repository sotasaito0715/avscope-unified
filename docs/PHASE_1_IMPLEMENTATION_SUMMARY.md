# PHASE 1 実装サマリー

## 📋 実装完了タスク

### ✅ Task 1: サイトマップを静的/永続キャッシュ化

**実装内容**:
- `/sitemap.xml` を `route.ts` に変更し、Vercel KVキャッシュを実装
- `/sitemap-items.xml` にVercel KVキャッシュを実装
- DMM API呼び出しを削減（キャッシュが期限切れの場合のみ再生成）
- バックオフ機能を実装（最大3回まで、指数バックオフ）

**変更ファイル**:
- `src/app/sitemap.ts` → 削除
- `src/app/sitemap.xml/route.ts` → 新規作成
- `src/app/sitemap-items.xml/route.ts` → 更新
- `src/lib/kv-cache.ts` → 新規作成

**KVキー設計**:
- `sitemap:main:v1` - メインサイトマップ
- `sitemap:items:v1` - 商品サイトマップ

**キャッシュ設定**:
- TTL: 7日間（604800秒）
- Cache-Control: `public, s-maxage=604800, stale-while-revalidate=604800`

---

### ✅ Task 2: 無限URL（page/sort）をSEO的に潰してBotのクロールを止める

**実装内容**:
- ページ上限を20ページに設定（page>20 は 404）
- ソート値を許可リスト化（それ以外はデフォルト値に）
- 2ページ目以降は `noindex, follow` を設定
- Canonical URLを必ず付与（page=1でデフォルトソートの場合はクエリなし）
- `robots.txt` を更新（2ページ目以降をブロック）

**変更ファイル**:
- `src/lib/seo-utils.ts` → 新規作成
- `src/app/page.tsx` → 更新
- `src/app/actress/[id]/page.tsx` → 更新
- `src/app/genre/[id]/page.tsx` → 更新
- `src/app/maker/[id]/page.tsx` → 更新
- `src/app/rankings/page.tsx` → 更新
- `public/robots.txt` → 更新

**ISR設定**:
- 24時間 → 48時間に延長（`revalidate = 172800`）

---

### ✅ Task 3: OGP画像生成を静的/永続キャッシュ化

**実装内容**:
- `/item/[cid]/opengraph-image` にVercel KVキャッシュを実装
- `/actress/[id]/opengraph-image` にVercel KVキャッシュを実装
- `/maker/[id]/opengraph-image` にVercel KVキャッシュを実装
- DMM API呼び出しを削減（キャッシュが期限切れの場合のみ再生成）
- バックオフ機能を実装（最大3回まで、指数バックオフ）

**変更ファイル**:
- `src/app/item/[cid]/opengraph-image.tsx` → 更新
- `src/app/actress/[id]/opengraph-image.tsx` → 更新
- `src/app/maker/[id]/opengraph-image.tsx` → 更新

**KVキー設計**:
- `ogp:item:{cid}:v1` - 商品OGP画像データ
- `ogp:actress:{id}:v1` - 女優OGP画像データ
- `ogp:maker:{id}:v1` - メーカーOGP画像データ

**キャッシュ設定**:
- TTL: 7日間（604800秒）
- ISR: `revalidate = 604800`（24時間 → 7日間）
- Cache-Control: `public, s-maxage=604800, stale-while-revalidate=604800`

---

### ✅ Task 4: generateMetadataとpageの重複fetchを1回に寄せる

**実装内容**:
- `/genre/[id]` と `/maker/[id]` で、`generateMetadata` とメインコンポーネントのパラメータを統一（`hits: 60`）
- Next.jsのfetchキャッシュを活用して重複API呼び出しを削減

**変更ファイル**:
- `src/app/genre/[id]/page.tsx` → 更新（`generateMetadata` で `hits: 60` を使用）
- `src/app/maker/[id]/page.tsx` → 更新（`generateMetadata` で `hits: 60` を使用）

**注意**: `/item/[cid]` と `/actress/[id]` は既にNext.jsのfetchキャッシュで1回に抑えられるため、大きな変更は不要

---

## 📦 追加パッケージ

- `@vercel/kv` - Vercel KVクライアント

---

## 🔧 変更ファイル一覧

### 新規作成
1. `src/lib/kv-cache.ts` - Vercel KVキャッシュヘルパー
2. `src/lib/seo-utils.ts` - SEO最適化ユーティリティ
3. `src/app/sitemap.xml/route.ts` - メインサイトマップ（KVキャッシュ付き）

### 更新
1. `src/app/sitemap-items.xml/route.ts` - 商品サイトマップ（KVキャッシュ付き）
2. `src/app/page.tsx` - 無限URL対策
3. `src/app/actress/[id]/page.tsx` - 無限URL対策
4. `src/app/genre/[id]/page.tsx` - 無限URL対策 + 重複fetch削減
5. `src/app/maker/[id]/page.tsx` - 無限URL対策 + 重複fetch削減
6. `src/app/rankings/page.tsx` - 無限URL対策
7. `src/app/item/[cid]/opengraph-image.tsx` - KVキャッシュ付き
8. `src/app/actress/[id]/opengraph-image.tsx` - KVキャッシュ付き
9. `src/app/maker/[id]/opengraph-image.tsx` - KVキャッシュ付き
10. `public/robots.txt` - 2ページ目以降をブロック

### 削除
1. `src/app/sitemap.ts` - `sitemap.xml/route.ts` に置き換え

---

## 🔑 KV/Blobのキー設計

### サイトマップ
- `sitemap:main:v1` - メインサイトマップ（MetadataRoute.Sitemap形式）
- `sitemap:items:v1` - 商品サイトマップ（XML文字列）

### OGP画像
- `ogp:item:{cid}:v1` - 商品OGP画像データ（DMMItem形式）
- `ogp:actress:{id}:v1` - 女優OGP画像データ（ActressInfo形式）
- `ogp:maker:{id}:v1` - メーカーOGP画像データ（MakerOGPData形式）

**例**:
- `ogp:item:abc123:v1`
- `ogp:actress:1044864:v1`
- `ogp:maker:2001:v1`

---

## 📊 追加したCache-Control一覧

### サイトマップ
- `/sitemap.xml`: `public, s-maxage=604800, stale-while-revalidate=604800`
- `/sitemap-items.xml`: `public, s-maxage=604800, stale-while-revalidate=604800`

### OGP画像
- `/item/[cid]/opengraph-image`: ISR `revalidate=604800`（7日間）
- `/actress/[id]/opengraph-image`: ISR `revalidate=604800`（7日間）
- `/maker/[id]/opengraph-image`: ISR `revalidate=604800`（7日間）

### ページ
- `/`: ISR `revalidate=172800`（48時間、24時間から延長）
- `/actress/[id]`: ISR `revalidate=172800`（48時間、24時間から延長）
- `/genre/[id]`: ISR `revalidate=172800`（48時間、24時間から延長）
- `/maker/[id]`: ISR `revalidate=172800`（48時間、24時間から延長）
- `/rankings`: ISR `revalidate=172800`（48時間、24時間から延長）

---

## ✅ 検証手順（curlで見るべきヘッダ）

### 1. サイトマップのキャッシュ確認

```bash
# メインサイトマップ
curl -I https://www.avscope.jp/sitemap.xml

# 確認すべきヘッダ:
# - Cache-Control: public, s-maxage=604800, stale-while-revalidate=604800
# - X-Cache-Status: HIT (キャッシュヒット時) または MISS (キャッシュミス時)
# - x-vercel-cache: HIT または MISS

# 商品サイトマップ
curl -I https://www.avscope.jp/sitemap-items.xml

# 確認すべきヘッダ:
# - Cache-Control: public, s-maxage=604800, stale-while-revalidate=604800
# - X-Cache-Status: HIT または MISS
# - x-vercel-cache: HIT または MISS
```

### 2. OGP画像のキャッシュ確認

```bash
# 商品OGP画像
curl -I https://www.avscope.jp/item/{cid}/opengraph-image

# 確認すべきヘッダ:
# - x-vercel-cache: HIT または MISS
# - Cache-Control: public, s-maxage=604800, stale-while-revalidate=604800 (Next.jsが自動付与)

# 女優OGP画像
curl -I https://www.avscope.jp/actress/{id}/opengraph-image

# メーカーOGP画像
curl -I https://www.avscope.jp/maker/{id}/opengraph-image
```

### 3. ページのキャッシュ確認

```bash
# トップページ
curl -I https://www.avscope.jp/

# 確認すべきヘッダ:
# - x-vercel-cache: HIT または MISS
# - Cache-Control: public, s-maxage=172800, stale-while-revalidate=345600 (Next.jsが自動付与)

# 女優ページ
curl -I https://www.avscope.jp/actress/{id}

# ジャンルページ
curl -I https://www.avscope.jp/genre/{id}

# メーカーページ
curl -I https://www.avscope.jp/maker/{id}
```

### 4. 無限URL対策の確認

```bash
# ページ上限チェック（21ページ目は404）
curl -I https://www.avscope.jp/?page=21
# 期待: HTTP/1.1 404 Not Found

# 2ページ目以降のnoindex確認
curl https://www.avscope.jp/?page=2 | grep -i "noindex"
# 期待: <meta name="robots" content="noindex, follow">

# Canonical URL確認
curl https://www.avscope.jp/?page=1 | grep -i "canonical"
# 期待: <link rel="canonical" href="https://www.avscope.jp/" />
```

### 5. robots.txtの確認

```bash
curl https://www.avscope.jp/robots.txt

# 確認すべき内容:
# - Disallow: /*?page=2 など、2ページ目以降がブロックされている
```

---

## 🎯 期待される効果

### Invocations削減
- **サイトマップ**: 約1.5M-2M削減（Botのアクセス頻度が高いため）
- **OGP画像**: 約0.5M-1M削減（SNSボットのアクセス）
- **無限URL**: 約1M-1.5M削減（Botのクロール制限）
- **合計**: 約3M-4.5M削減（約60-90%削減）

### CPU削減
- **サイトマップ**: 約10-15h削減（DMM API呼び出し削減）
- **OGP画像**: 約3-5h削減（DMM API呼び出し削減）
- **無限URL**: 約5-8h削減（ページ生成削減）
- **合計**: 約18-28h削減（約50-80%削減）

### Memory削減
- **サイトマップ**: 約50-80 GB-Hrs削減
- **OGP画像**: 約20-40 GB-Hrs削減
- **無限URL**: 約30-50 GB-Hrs削減
- **合計**: 約100-170 GB-Hrs削減（約45-75%削減）

### Fast Origin Transfer削減
- **キャッシュ延長**: 約5-10GB削減（15-30%削減）

---

## ⚠️ 注意事項

1. **Vercel KVの設定が必要**
   - VercelダッシュボードでKVストレージを有効化する必要があります
   - 環境変数は自動的に設定されます

2. **初回アクセス時の遅延**
   - キャッシュミス時はDMM APIを呼び出すため、初回アクセス時に遅延が発生する可能性があります
   - バックオフ機能により、エラー時の連打を防いでいます

3. **キャッシュの手動クリア**
   - KVキャッシュを手動でクリアする場合は、VercelダッシュボードからKVストレージを操作する必要があります

4. **robots.txtの更新**
   - 2ページ目以降をブロックしているため、検索エンジンのクロールが制限されます
   - 1ページ目は正常にインデックスされます

---

## 📝 次のステップ

1. **VercelダッシュボードでUsageを確認**
   - 実装後、1週間程度でUsageの削減効果を確認
   - Route別のUsageを確認し、効果を測定

2. **KVキャッシュの監視**
   - KVストレージの使用量を監視
   - キャッシュヒット率を確認

3. **必要に応じてPHASE 2を検討**
   - さらなる最適化が必要な場合は、PHASE 2を検討

