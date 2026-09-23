# マスタープロンプト：AV Scope 記事生成（Cursor用）

## 概要

このプロンプトは、**AV Scope（avscope.jp）** 用のランキング記事を自動生成するための手順書です。DMM/FANZA APIからデータを取得し、VR作品を除外し、許可メーカーのみをフィルタリングして、**content/articles/** に配置するMarkdown記事を作成します。

**重要**: 記事生成時は以下のフォーマット要件を遵守すること。

1. **出力形式**: 記事は **content/articles/{slug}.md** に **Front Matter + Markdown本文** で保存する
2. **Front Matter**: READMEのおすすめ記事仕様に準拠（slug, title, description, published, relatedItems, relatedActresses 等）
3. **内部リンク**: 作品は `/item/{content_id}`、ジャンルは `/genre/{genre_id}`、女優は `/actress/{id}` を使用
4. **ランキング項目**: `### 1位` / `### 第2位：` 形式、画像は `![alt](url)`、おすすめポイントは `#### おすすめポイント`
5. **定型プロフィール禁止**: 身長・スリーサイズ・お気に入り登録数は記載しない。作品内容・女優の演技に基づくコメントのみ
6. **サイト名**: 文中の紹介は「AV Scope」「avscope.jp」に統一（hentaitok表記は使わない）
7. **作業用ファイル**: APIレスポンスJSON・スクリプトは **scripts/article-generation/** に格納

---

## 1. 必要な情報の確認

記事生成前にユーザーから取得する情報：

1. **`{keyword}`**: 記事化したいジャンル・ニーズ（例：ぽっちゃり、人妻、女上司 など）
2. **ランキング種別**: A＝AV名作ランキング（作品）／ B＝AV女優ランキング（人物）。未指定なら A
3. **近似キーワード**: `{keyword}` がヒットしない時に近いキーワードを自動採用してよいか … Y/N

---

## 2. 固定設定

### API設定（環境変数を使用）

- **API_ID**: `process.env.DMM_API_ID`（.env.local の DMM_API_ID）
- **AFFILIATE_ID**: `process.env.DMM_AFFILIATE_ID`（.env.local の DMM_AFFILIATE_ID）
- **ItemList API**: `https://api.dmm.com/affiliate/v3/ItemList`
- **ActressSearch API**: `https://api.dmm.com/affiliate/v3/ActressSearch`
- **サイト**: FANZA / **サービス**: digital / **フロア**: videoa
- **取得件数**: 100件 / **ソート**: rank

※ 本番では Next.js の API ルート（`/api/items`, `/api/actress`）経由でも可。スクリプトから直接DMMを叩く場合は上記と .env を参照。

### VR作品の除外

- ジャンル名に「VR」を含む作品は除外（VR専用、ハイクオリティVR、8KVR 等）
- タイトルに「VR」「【VR】」を含む作品も除外

### 許可メーカーリスト

元マスタープロンプトの許可メーカーリストをそのまま利用。メーカー絞り込みはAPI取得**後**に実施。マッチングは完全一致・部分一致・カタカナ/英語表記の揺れに対応すること。

（一覧は元の MASTER_PROMPT_ARTICLE_GENERATION.md の「許可メーカーリスト」セクションを参照）

---

## 3. データパス・URL（AVSCOPE仕様）

| 用途           | パス／URL |
|----------------|-----------|
| ジャンル一覧   | `data/genres/genres_summary.json`（genre_id, genre_name） |
| 記事保存先     | `content/articles/{slug}.md` |
| 作業用フォルダ | `scripts/article-generation/` |
| APIレスポンス  | `scripts/article-generation/response-{keyword}-{genre_id}.json` |
| 作品ページ     | `https://www.avscope.jp/item/{content_id}` または `/item/{content_id}` |
| ジャンルページ | `https://www.avscope.jp/genre/{genre_id}` または `/genre/{genre_id}` |
| 女優ページ     | `https://www.avscope.jp/actress/{id}` または `/actress/{id}` |

---

## 4. 作業手順

### ステップ1: キーワードから genre_id を取得

1. `data/genres/genres_summary.json` を読み込む
2. `{keyword}` と一致または部分一致する `genre_name` を検索
3. 該当する `genre_id` を取得し変数 `genreId` に格納
4. 見つからない場合: ユーザー確認、または allowSimilar=Y なら近似キーワードを試す
5. 記事内のジャンルリンクは `/genre/${genreId}` を使用

### ステップ2: DMM APIからデータ取得

1. ItemList API を呼び出す（article=genre, article_id={genre_id}, hits=100, sort=rank）
2. 取得JSONを `scripts/article-generation/response-{keyword}-{genre_id}.json` に保存
3. 0件の場合: allowSimilar=Y なら同系語・類似タグで再検索し、最多ヒットを採用

### ステップ3: VR作品の除外

- items の `iteminfo.genre[]` でジャンル名に「VR」を含むものを除外
- タイトルに「VR」「【VR】」を含むものを除外
- 除外件数をログ出力

### ステップ4: メーカーフィルタリング

- 各 item の `iteminfo.maker[0].name` を許可メーカーリストと照合（柔軟マッチ）
- 許可メーカーのみ残す
- 10件未満の場合は注記「※該当が少なかったため本数を絞っています」を記事に追加

### ステップ5: ランキング抽出

**ランキングA（作品）**

- 上から最大10件。各 item で取得するもの: title, content_id, affiliateURL（またはURL）, sampleImageURL / imageURL, maker, iteminfo.actress[0]（女優ID取得用）
- 画像は上位3枚まで `![alt](url)` で本文に含める
- 各作品の主な女優のIDで ActressSearch API から詳細取得

**ランキングB（女優）**

- items の `iteminfo.actress[]` を走査し、女優IDごとに出演数カウント。単独出演は加点
- 上位10名。女優名・ID・出演本数・サンプル画像・女優直リンク（/actress/{id}）を記載

### ステップ6: 女優情報の取得

- 各ランキング項目の主な女優（iteminfo.actress[0]）のIDで ActressSearch API を呼ぶ
- name, height, bust, cup, waist, hip, birthday 等を取得（記事では定型プロフィール記載は避け、作品・演技ベースのコメントに利用）

### ステップ6.5: FANZAページから紹介文・レビュー取得（オプション・推奨）

- 全順位についてFANZAページから紹介文・レビューを取得し、**各順位ごとに異なる**おすすめポイントを生成
- Playwright 等で年齢確認を突破してアクセス。あらすじ・レビューを抽出し、定型プロフィール・お気に入り登録数は使わない
- 実装は元マスタープロンプトの「ステップ6.5」「ステップ6.6」のセレクター・再試行・見どころ生成ロジックを参照

### ステップ7: 記事本文の生成（AVSCOPE向けテンプレート）

- **見出し**: `# {keyword}AVおすすめランキング【2025年最新版】` 等、年度・キーワードを反映
- **AV Scope 紹介セクション**:  
  「**{keyword}AVを探すならAV Scope！**」  
  AV Scopeは、DMM/FANZAのデータで人気ランキング・ジャンル検索ができるAV検索サイトです。{keyword}の作品をランキングやジャンルからすぐ探せます。  
  **{keyword}AVをジャンルから探す**: [ジャンルから{keyword}を探す](/genre/{genreId})
- **本文**: ランキングTOP10を `### 1位` / `### 第2位：` … で記載。各項目に画像・**項目ごとに変わる見出し**（例：この作品の魅力／あらすじ・見どころ／作品のポイント など）・2〜4文の紹介段落・4〜5項目の箇条書き・ジャンル／価格メモ・リンクを記載
- **リンク**:  
  - 詳細: `[▶ 詳細を見る](/item/{content_id})`  
  - 購入: `[購入ページへ]({affiliateURL})`
- **まとめ**: `## まとめ` で締め、出典として DMM/FANZA を記載

### ステップ8: Front Matter の生成（必須）

記事ファイルの先頭は次の形式とする。

```yaml
---
slug: {slug}
title: {keyword}AVおすすめランキング【2025年最新版】
description: {160文字以内の説明。キーワード・ランキング・AV Scopeを自然に含める}
published: true
publishedAt: 2025-XX-XXT10:00:00Z
updatedAt: 2025-XX-XXT10:00:00Z
author:
  name: AV Scope編集部
  role: 編集長
category: ランキング
tags:
  - ランキング
  - {keyword}
  - おすすめ
keywords:
  - {keyword}
  - AV
  - ランキング
  - DMM
  - FANZA
ogImage: {1位作品のサムネイルURL}
canonicalUrl: https://www.avscope.jp/articles/{slug}
featured: true
priority: 100
relatedItems:
  - {content_id_1}
  - {content_id_2}
  # ... ランキング10件の content_id
relatedActresses:
  - {actress_id_1}
  - {actress_id_2}
  # ... 登場女優のID（重複除く）
---
```

- **slug**: ファイル名と一致（例: `pocchari-av-ranking-2025`）
- **relatedItems**: ランキングに含めた作品の content_id のリスト
- **relatedActresses**: ランキングで触れた女優のIDリスト（女優ランキングの場合は特に重要）

### ステップ9: ファイルの保存

- 保存先: **content/articles/{slug}.md**
- 内容: 上記 Front Matter + マークダウン本文（改行は `\n`、BOMなしUTF-8）
- 作業用JSON・スクリプトは **scripts/article-generation/** に保存

### ステップ10: SEO・最終チェック

- タイトル60文字以内、description 160文字以内
- 画像はすべて `![適切なalt](url)` 形式
- 内部リンクは `/item/`, `/genre/`, `/actress/` を使用
- まとめ・タグ・キーワードに {keyword} を自然に配置

---

## 5. 記事フォーマット詳細（AVSCOPE）

### ランキング1項目の構成

- **セクション見出しは項目ごとに変える**：「一言レビュー」「ここが刺さる」のワンパターンは使わない。以下のような見出しペアを順番にローテーションする。
  - 例：（この作品の魅力 / こんな人におすすめ）、（あらすじ・見どころ / 評価ポイント）、（作品のポイント / 注目のシーン・演出）、（おすすめポイント / 購入前にチェック）、（見どころ / レビューから見るポイント）、（作品の特徴 / 押さえておきたいポイント）、（この一本の魅力 / 視聴のポイント）、（作品紹介 / 気になるポイント）、（概要 / おすすめ理由）、（この作品の見どころ / チェックしたいポイント）
- **紹介文は2〜4文程度の段落**で書く（1文だけの一言レビューにしない）。
- **箇条書きは4〜5項目**とし、各項目は短い文で具体的に書く。

### ランキング1項目のMarkdown例

```markdown
### 1位 [作品タイトル](/item/{content_id})（{content_id}）

[![作品タイトル](画像URL)](/item/{content_id})

**この作品の魅力**  
（女優名）出演、（メーカー名）の一本。（ジャンル）ジャンルの人気作としてランキングに登場しています。収録時間は○○分。レビュー評価はX.XX/5（N件）で、視聴者からの支持も得ています。

**こんな人におすすめ**
- **ジャンルA ジャンルB ジャンルC**といったジャンルが揃っており、好みに合うかチェックしやすい。
- 収録時間は**○○分**で、たっぷり楽しめる尺になっている。
- レビューは**X.XX/5（N件）**。評価の高さが人気の理由の一つ。
- （ジャンル）系の作品を探している人におすすめの一本。

**ジャンル／価格メモ**  
`ジャンルタグ` … レビュー **X.XX/5（N件）**。ストリーミング〜、DL〜。

[▶ 詳細を見る](/item/{content_id}) ｜ [購入ページへ]({affiliateURL})

---
```

（2位以降は「あらすじ・見どころ」「作品のポイント」など、上記の見出しペアを順に使い、紹介文・箇条書きもそれぞれ長めに書く。）

### 禁止事項

- お気に入り登録数の記載
- 身長・スリーサイズ・おっぱいのハリ・肌・フェチ度などの定型プロフィールのみの紹介
- hentaitok 表記・「スワイプで動画を観る」等の他サイト専用表現（AV Scopeでは「詳細を見る」「ジャンルから探す」に統一）

---

## 6. エラーハンドリング

- **API 0件**: allowSimilar=Y なら近似キーワードで再取得、N ならユーザーに確認
- **メーカー絞り後10件未満**: 注記を付けて記事は作成
- **女優情報取得失敗**: 当該項目は女優名・評価を省略して作品情報のみ記載
- **JSON BOM**: 読み込み時に `replace(/^\uFEFF/, '')` でBOM削除

---

## 7. チェックリスト

- [ ] genre_id が data/genres/genres_summary.json と一致しているか
- [ ] VR除外・メーカーフィルタが正しく適用されているか
- [ ] 記事が content/articles/{slug}.md に保存されているか
- [ ] Front Matter に relatedItems / relatedActresses が含まれているか
- [ ] 内部リンクが /item/, /genre/, /actress/ になっているか
- [ ] サイト名が AV Scope / avscope.jp に統一されているか
- [ ] 作業用ファイルが scripts/article-generation/ に格納されているか

---

## 8. Python補助スクリプトについて

`scripts/article-generation/` に以下を配置することを推奨する。

- **fetch_genre_ranking.py**: ジャンルID取得 → DMM API取得 → VR除外 → メーカー絞り → ランキング10件抽出 → JSON保存。Front Matter 用の relatedItems / relatedActresses リストを出力。
- 記事本文の組み立ては、上記手順と本マスタープロンプトに従い、Cursor上で行うか、別スクリプトでMarkdown生成してもよい。

FANZAあらすじ・レビュー取得は、元マスタープロンプトの Playwright 実装を流用するか、Python の Playwright で同様の処理を実装する。

---

以上が、AV Scope 用記事生成のマスタープロンプトです。元の hentaitok 向け手順のロジック（VR除外・許可メーカー・評価・おすすめポイント生成）は維持しつつ、出力先・URL・表記を AVSCOPE 仕様に合わせてあります。
