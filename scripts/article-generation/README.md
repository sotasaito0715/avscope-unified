# AV Scope 記事生成スクリプト

おすすめ記事（ランキング等）のデータ取得と Front Matter 用IDの出力を行います。

## 前提

- **マスタープロンプト**: 記事の書き方・フォーマットは `docs/MASTER_PROMPT_ARTICLE_GENERATION_AVSCOPE.md` に従う
- **環境変数**: `.env.local` に `DMM_API_ID` と `DMM_AFFILIATE_ID` を設定（または export）

## fetch_genre_ranking.py

ジャンルキーワードから DMM ItemList API でランキングを取得し、VR除外・許可メーカーフィルタをかけて TOP10 を抽出します。

```bash
# 必須: API認証
export DMM_API_ID=xxx
export DMM_AFFILIATE_ID=yyy

# 実行（キーワードのみ）
python scripts/article-generation/fetch_genre_ranking.py 人妻

# 近似キーワードを許可する場合
python scripts/article-generation/fetch_genre_ranking.py 女上司 --allow-similar
```

### 出力

1. **JSON**: `scripts/article-generation/response-{keyword}-{genre_id}.json`  
   - フィルタ後の `result.items` にランキング最大10件
2. **標準出力**: Front Matter 用の `relatedItems` / `relatedActresses` を YAML で表示  
   - これを `content/articles/{slug}.md` の Front Matter にコピーして使う

### 許可メーカー

スクリプト内の `ALLOWED_MAKERS_RAW` は、元の `MASTER_PROMPT_ARTICLE_GENERATION.md` の「許可メーカーリスト」と一致させることを推奨します。必要に応じて同リストをコピーして更新してください。

## batch_generate_actress_articles.py

女優おすすめ記事を一括生成します。ジャンル記事と同じ要領で、女優ごとに DMM ItemList API（article=actress）で人気作品を取得し、VR除外・許可メーカー絞り後に TOP10 の記事を出力します。ファイル名に実行日の日付を含めます。

```bash
export DMM_API_ID=xxx DMM_AFFILIATE_ID=yyy
python scripts/article-generation/batch_generate_actress_articles.py
```

- 出力: `content/articles/actress-{actress_id}-ranking-{YYYY-MM-DD}.md`
- 女優IDリストはスクリプト内の `ACTRESS_IDS` で変更可能です。

## 記事本文について

- 記事の **Markdown 本文** は、上記マスタープロンプトの手順に従い、Cursor 上で生成するか、別スクリプトで組み立ててください。
- FANZA のあらすじ・レビュー取得は、元マスタープロンプトの Playwright 手順を参照し、必要なら Node または Python で実装してください。
