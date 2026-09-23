# `/item/[cid]`ページのAPIコール数

## 現在の実装でのAPIコール数

### サーバーサイド（ページ生成時）

1. **`fetchItemDetail(cid)`** - 1回
   - 主要作品の詳細情報を取得
   - 場所: `src/app/item/[cid]/page.tsx:19`

2. **`sameActressItems` - 出演女優の他の作品** - **女優の数だけ**
   - 各女優IDに対して`fetchItems`を並列実行
   - 場所: `src/app/item/[cid]/page.tsx:30-38`
   - 例: 女優が3人いる場合 → 3回のAPIコール

3. **`viewedTogetherItems` - この作品を閲覧した人はこちらも見ています** - 1回
   - ジャンルがあればジャンルから、なければメーカーから取得
   - 場所: `src/app/item/[cid]/page.tsx:58 または 66`

### クライアントサイド（RelatedActressesコンポーネント）

4. **女優情報の取得** - 1回（通常時）
   - 複数の女優IDをカンマ区切りで一度にリクエスト
   - 場所: `src/components/RelatedActresses.tsx:48`
   - フォールバック時は女優の数だけ（個別リクエスト）

### メタデータ生成時（Next.jsキャッシュにより実質的に重複カウントしない）

5. **`generateMetadata`内の`fetchItemDetail(cid)`** - 1回（キャッシュヒット）
   - 場所: `src/app/item/[cid]/page.tsx:284`

## 合計APIコール数

### 通常時（RelatedActressesが正常に動作する場合）

```
合計 = 1 + 女優の数 + 1 + 1 = 3 + 女優の数
```

**具体例:**
- 女優が1人の場合: **4回**
- 女優が3人の場合: **6回**
- 女優が5人の場合: **8回**

### フォールバック時（RelatedActressesが個別リクエストにフォールバックする場合）

```
合計 = 1 + 女優の数 + 1 + 女優の数 = 2 + 女優の数 × 2
```

**具体例:**
- 女優が1人の場合: **4回**
- 女優が3人の場合: **8回**
- 女優が5人の場合: **12回**

## APIコールの内訳（女優が3人の場合の例）

### 通常時（6回）

1. `fetchItemDetail(cid)` - 1回
2. `fetchItems({ article: 'actress', article_id: 'actress_id_1' })` - 1回
3. `fetchItems({ article: 'actress', article_id: 'actress_id_2' })` - 1回
4. `fetchItems({ article: 'actress', article_id: 'actress_id_3' })` - 1回
5. `fetchItems({ article: 'genre' または 'maker', article_id: '...' })` - 1回
6. `fetch('/api/actress?actress_id=actress_id_1,actress_id_2,actress_id_3')` - 1回（クライアントサイド）

## 最適化の余地

現在の実装では、女優の数だけ`fetchItems`を呼び出していますが、以下の最適化が可能です：

1. **女優の作品を1回のリクエストで取得**
   - ただし、DMM APIが複数の女優IDを一度に受け付けるかは要確認
   - 対応していない場合は、現在の並列実行が最適

2. **キャッシュの活用**
   - 同じ女優の作品は1時間キャッシュされているため、2回目以降は高速
   - ただし、初回アクセス時は全てのAPIコールが発生

3. **データ取得の削減**
   - 女優の数が多い場合、最初の数人のみ取得するなど

