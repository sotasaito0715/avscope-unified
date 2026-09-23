# Sitemap生成スクリプト

このディレクトリには、DMM APIから女優・ジャンルIDを取得し、静的Sitemapファイルを生成するスクリプトが含まれています。

## 前提条件

- `.env.local`ファイルに以下の環境変数が設定されていること：
  ```
  DMM_API_ID=tmuYYhApYPz2LaGknMun
  DMM_AFFILIATE_ID=masaeng-990
  ```

- 必要なツール：
  - `jq` - JSON処理用
  - `curl` - APIリクエスト用

## スクリプト一覧

### 1. `fetch-actresses.sh`
DMM APIから全女優のIDを取得し、JSONファイルに保存します。

**使用方法:**
```bash
# npmスクリプト経由（推奨）
npm run sitemap:fetch:actresses

# 直接実行
bash scripts/fetch-actresses.sh

# 環境変数を指定して実行
API_ID=your_api_id AFFILIATE_ID=your_affiliate_id bash scripts/fetch-actresses.sh
```

**出力:**
- `./data/actress/actresses_summary.json` - 女優ID、名前、読み仮名を含むJSONファイル

**環境変数:**
- `DMM_API_ID` - DMM API ID（`.env.local`から自動読み込み）
- `DMM_AFFILIATE_ID` - DMMアフィリエイトID（`.env.local`から自動読み込み）
- `HITS` - 1ページあたりの取得件数 (デフォルト: `100`)
- `SORT` - ソート順 (デフォルト: `name`)
- `OUTPUT_DIR` - 出力ディレクトリ (デフォルト: `./data/actress`)
- `SLEEP_SEC` - リクエスト間の待機時間（秒） (デフォルト: `0.1`)

### 2. `fetch-genres.sh`
DMM APIから全ジャンルのIDを取得し、JSONファイルに保存します。

**使用方法:**
```bash
# npmスクリプト経由（推奨）
npm run sitemap:fetch:genres

# 直接実行
bash scripts/fetch-genres.sh

# 環境変数を指定して実行
API_ID=your_api_id AFFILIATE_ID=your_affiliate_id FLOOR_IDS="43 44" bash scripts/fetch-genres.sh
```

**出力:**
- `./data/genres/genres_summary.json` - ジャンルID、名前を含むJSONファイル

**環境変数:**
- `DMM_API_ID` - DMM API ID（`.env.local`から自動読み込み）
- `DMM_AFFILIATE_ID` - DMMアフィリエイトID（`.env.local`から自動読み込み）
- `HITS` - 1ページあたりの取得件数 (デフォルト: `500`)
- `FLOOR_IDS` - フロアIDのリスト (デフォルト: `43 44`)
- `OUTPUT_DIR` - 出力ディレクトリ (デフォルト: `./data/genres`)
- `SLEEP_SEC` - リクエスト間の待機時間（秒） (デフォルト: `0.1`)

### 3. `generate-sitemap.js`
JSONファイルからSitemap XMLファイルを生成します。

**使用方法:**
```bash
# npmスクリプト経由（推奨）
npm run sitemap:generate

# 直接実行
node scripts/generate-sitemap.js

# オプションを指定して実行
node scripts/generate-sitemap.js \
  --actresses ./data/actress/actresses_summary.json \
  --genres ./data/genres/genres_summary.json \
  --output-dir ./public \
  --base-url https://www.avscope.jp
```

**出力:**
- `./public/sitemap-actresses.xml` - 女優ページのSitemap
- `./public/sitemap-categories.xml` - ジャンルページのSitemap

**オプション:**
- `--actresses <path>` - 女優JSONファイルのパス (デフォルト: `./data/actress/actresses_summary.json`)
- `--genres <path>` - ジャンルJSONファイルのパス (デフォルト: `./data/genres/genres_summary.json`)
- `--output-dir <dir>` - 出力ディレクトリ (デフォルト: `./public`)
- `--base-url <url>` - ベースURL (デフォルト: `https://www.avscope.jp`)

## npmスクリプト

package.jsonに以下のスクリプトが追加されています：

```bash
# 女優IDを取得
npm run sitemap:fetch:actresses

# ジャンルIDを取得
npm run sitemap:fetch:genres

# JSONからSitemapを生成
npm run sitemap:generate

# すべてを順番に実行（推奨）
npm run sitemap:all
```

## 完全なワークフロー

1. **データ取得とSitemap生成（一括実行）**
   ```bash
   npm run sitemap:all
   ```
   これにより、以下の順序で実行されます：
   - 女優IDの取得
   - ジャンルIDの取得
   - Sitemap XMLの生成

2. **個別に実行する場合**
   ```bash
   # 1. 女優IDを取得
   npm run sitemap:fetch:actresses
   
   # 2. ジャンルIDを取得
   npm run sitemap:fetch:genres
   
   # 3. Sitemapを生成
   npm run sitemap:generate
   ```

3. **生成されたファイルの確認**
   - `./data/actress/actresses_summary.json` - 女優データ（JSON）
   - `./data/genres/genres_summary.json` - ジャンルデータ（JSON）
   - `./public/sitemap-actresses.xml` - 女優ページのSitemap
   - `./public/sitemap-categories.xml` - ジャンルページのSitemap

## 動的Sitemap生成との統合

動的Sitemap生成機能（`src/app/sitemap-actresses.xml/route.ts`、`src/app/sitemap-categories.xml/route.ts`）は、生成されたJSONファイルを自動的に読み込んでSitemapを生成します。

つまり：
1. `npm run sitemap:all`でJSONファイルを生成
2. 動的Sitemap生成がJSONファイルを読み込んでSitemapを生成
3. `/sitemap-actresses.xml`と`/sitemap-categories.xml`でアクセス可能

## 注意事項

- DMM APIのレート制限に注意してください。`SLEEP_SEC`を調整してリクエスト間隔を調整できます。
- 大量のデータを取得する場合、処理に時間がかかります（数時間かかる場合があります）。
- 初回実行時は、全データを取得するため時間がかかります。
- データ取得後は、定期的に`npm run sitemap:all`を実行してデータを更新してください。

## トラブルシューティング

### API認証エラー
`.env.local`ファイルに`DMM_API_ID`と`DMM_AFFILIATE_ID`が正しく設定されているか確認してください。

### ファイルが見つからないエラー
`data/actress/`と`data/genres/`ディレクトリが存在することを確認してください。スクリプトは自動的に作成しますが、権限の問題がある場合は手動で作成してください。

### JSONファイルが空
APIリクエストが失敗している可能性があります。スクリプトの出力を確認し、エラーメッセージを確認してください。

