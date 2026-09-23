# お気に入り共有機能の仕組み

## 概要

`http://localhost:3000/favorites?ids=atad00173%2C1069632%2Csmcd00016` というURLで、共有されたお気に入りリストを表示する機能の仕組みを説明します。

## フロー全体図

```
[1. お気に入り追加] → [2. 共有URL生成] → [3. URL共有] → [4. URLアクセス] → [5. データ取得・表示]
```

## 詳細な動作フロー

### 1. お気に入りの追加と共有URL生成

**場所**: `src/components/FavoritesModal.tsx`

```typescript
// お気に入りリストからIDを抽出して共有URLを生成
useEffect(() => {
  if (typeof window !== 'undefined' && favorites.length > 0) {
    // 例: ['atad00173', '1069632', 'smcd00016']
    const favoriteIds = favorites.map(fav => fav.id).join(',');
    
    // URLを生成: /favorites?ids=atad00173,1069632,smcd00016
    const url = new URL('/favorites', window.location.origin);
    url.searchParams.set('ids', favoriteIds);
    setShareUrl(url.toString());
  }
}, [favorites]);
```

**処理内容**:
- ローカルストレージに保存されているお気に入りリストから、各アイテムの`id`を取得
- カンマ区切りで結合（例: `"atad00173,1069632,smcd00016"`）
- `/favorites` ページのURLパラメータとして設定

**生成されるURL例**:
```
http://localhost:3000/favorites?ids=atad00173,1069632,smcd00016
```

---

### 2. URLパラメータの受信とデコード

**場所**: `src/app/favorites/page.tsx`

```typescript
export default async function FavoritesPage({ searchParams }: FavoritesPageProps) {
  const params = await searchParams;
  const idsParam = params.ids || ''; // "atad00173,1069632,smcd00016"
  
  // URLエンコードされた場合も自動デコードされる（%2C → ,）
  // 実際の値: "atad00173,1069632,smcd00016"
}
```

**Next.js 15の仕様**:
- `searchParams`は`Promise`として渡されるため、`await`で取得
- URLエンコード（`%2C` = カンマ）は自動的にデコードされる

**URLパラメータの例**:
- **エンコード前**: `?ids=atad00173,1069632,smcd00016`
- **エンコード後**: `?ids=atad00173%2C1069632%2Csmcd00016`（ブラウザが自動エンコード）
- **受信時**: Next.jsが自動デコードして `"atad00173,1069632,smcd00016"` として取得

---

### 3. IDの分割と分類

**場所**: `src/app/favorites/page.tsx`

```typescript
// IDをカンマで分割
const ids = idsParam.split(',').filter(id => id.trim());
// 結果: ['atad00173', '1069632', 'smcd00016']

// IDが作品IDか女優IDかを判定
function isActressId(id: string): boolean {
  // 数字のみの場合は女優ID
  return /^\d+$/.test(id);
}

// 分類処理
ids.forEach(id => {
  if (isActressId(id)) {
    actressIds.push(id);    // '1069632' → 女優ID
  } else {
    itemIds.push(id);       // 'atad00173', 'smcd00016' → 作品ID
  }
});
```

**判定ロジック**:
- **数字のみ**（例: `1069632`）→ **女優ID**
- **英数字の組み合わせ**（例: `atad00173`, `smcd00016`）→ **作品ID（content_id）**

**分類結果の例**:
```typescript
itemIds = ['atad00173', 'smcd00016']    // 作品ID
actressIds = ['1069632']                 // 女優ID
```

---

### 4. データの並列取得

**場所**: `src/app/favorites/page.tsx` → `fetchFavorites()` 関数

```typescript
async function fetchFavorites(ids: string[]) {
  // ===== 作品データの取得 =====
  const itemPromises = itemIds.map(id => fetchItemDetail(id));
  // [
  //   fetchItemDetail('atad00173'),
  //   fetchItemDetail('smcd00016')
  // ]
  
  const itemResults = await Promise.all(itemPromises);
  // 並列実行により高速化（通常の順次実行なら 2秒 → 並列で 1秒）

  // ===== 女優データの取得 =====
  const actressPromises = actressIds.map(id => fetchActressInfo(id));
  // [
  //   fetchActressInfo('1069632')
  // ]
  
  const actressResults = await Promise.all(actressPromises);
  
  // 型変換（lib/dmm の型 → types/dmm の型）
  actressResults.forEach(actress => {
    if (actress) {
      actresses.push(convertActressInfo(actress));
    }
  });

  return { items, actresses };
}
```

**データ取得フロー**:

#### 4-1. 作品データ取得（`fetchItemDetail`）

**場所**: `src/lib/dmm.ts`

```typescript
export async function fetchItemDetail(cid: string): Promise<DMMItem | null> {
  // 1. DMM APIにリクエスト
  // URL: https://api.dmm.com/affiliate/v3/ItemList?api_id=...&cid=atad00173
  
  // 2. APIレスポンスを受け取る
  // {
  //   result: {
  //     items: [
  //       {
  //         content_id: "atad00173",
  //         title: "ATTACKERS 女優名鑑 松本いちか 14時間",
  //         imageURL: { ... },
  //         prices: { ... },
  //         ...
  //       }
  //     ]
  //   }
  // }
  
  // 3. 最初の1件を返す（ItemList APIは1件の詳細も返せる）
  return item ? normalizeItemPrices(item) : null;
}
```

#### 4-2. 女優データ取得（`fetchActressInfo`）

**場所**: `src/lib/dmm.ts`

```typescript
export async function fetchActressInfo(actressId: string): Promise<ActressInfo | null> {
  // 1. 内部APIルートにリクエスト
  // URL: http://localhost:3000/api/actress?actress_id=1069632
  
  // 2. 内部APIルートがDMM APIにリクエスト
  // URL: https://api.dmm.com/affiliate/v3/ActressSearch?api_id=...&actress_id=1069632
  
  // 3. レスポンスを受け取る
  // {
  //   actress: [
  //     {
  //       id: "1069632",
  //       name: "石川澪",
  //       ruby: "いしかわみお",
  //       imageURL: { ... },
  //       ...
  //     }
  //   ]
  // }
  
  // 4. 最初の1件を返す
  return data.actress?.[0] || null;
}
```

**重要なポイント**:
- **並列実行**: `Promise.all()` により複数のAPIリクエストを同時に実行
- **型変換**: 女優データは `lib/dmm` の型（`id: string`）から `types/dmm` の型（`id: number`）に変換

---

### 5. 型変換処理

**場所**: `src/app/favorites/page.tsx` → `convertActressInfo()` 関数

```typescript
function convertActressInfo(
  actress: import('@/lib/dmm').ActressInfo  // { id: "1069632", ... }
): ActressInfo {                              // { id: 1069632, ... }
  return {
    id: parseInt(actress.id, 10),           // "1069632" → 1069632
    name: actress.name,
    ruby: actress.ruby,
    bust: actress.bust ? parseInt(actress.bust, 10) : undefined,  // "88" → 88
    // ... 他のフィールドも同様に変換
  };
}
```

**変換が必要な理由**:
- `lib/dmm.ts` の `ActressInfo`: DMM APIの生データ形式（`id: string`, `bust: string`）
- `types/dmm.ts` の `ActressInfo`: アプリケーションで使用する形式（`id: number`, `bust: number`）
- `ActressCard` コンポーネントは `types/dmm.ts` の型を期待しているため、変換が必要

---

### 6. データの表示

**場所**: `src/app/favorites/page.tsx` → JSX部分

```typescript
// 作品セクション
{items.length > 0 && (
  <div className="mb-12">
    <h2>作品 ({items.length}件)</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {items.map((item) => (
        <ItemCard key={item.content_id} item={item} />
      ))}
    </div>
  </div>
)}

// 女優セクション
{actresses.length > 0 && (
  <div>
    <h2>女優 ({actresses.length}名)</h2>
    <div className="overflow-x-auto">
      <div className="flex gap-4">
        {actresses.map((actress) => (
          <ActressCard key={actress.id} actress={actress} />
        ))}
      </div>
    </div>
  </div>
)}
```

**表示レイアウト**:
- **作品**: グリッドレイアウト（スマホ: 2列、PC: 5列）
- **女優**: 横スクロール表示（スマホ向けに最適化）

---

## データフロー図

```
┌─────────────────────────────────────────────────────────────┐
│ 1. お気に入りリスト（LocalStorage）                          │
│    favorites = [                                             │
│      { id: 'atad00173', type: 'item', ... },                │
│      { id: '1069632', type: 'actress', ... },               │
│      { id: 'smcd00016', type: 'item', ... }                 │
│    ]                                                         │
└───────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. 共有URL生成（FavoritesModal）                             │
│    favoriteIds = 'atad00173,1069632,smcd00016'              │
│    shareUrl = '/favorites?ids=atad00173,1069632,smcd00016'  │
└───────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼ (URL共有)
┌─────────────────────────────────────────────────────────────┐
│ 3. URLアクセス（/favorites?ids=...）                         │
│    Next.jsが自動デコード                                      │
│    idsParam = 'atad00173,1069632,smcd00016'                  │
└───────────────────────────────┬─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. IDの分類                                                  │
│    ids = ['atad00173', '1069632', 'smcd00016']              │
│    ↓                                                         │
│    itemIds = ['atad00173', 'smcd00016']  (英数字)           │
│    actressIds = ['1069632']  (数字のみ)                      │
└───────────────────────────────┬─────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│ 5-1. 作品データ取得        │  │ 5-2. 女優データ取得        │
│ fetchItemDetail('atad00173')│ │ fetchActressInfo('1069632')│
│ fetchItemDetail('smcd00016')│ │                           │
│ Promise.all()で並列実行     │  │                           │
│                            │  │                           │
│ → DMM API: ItemList        │  │ → DMM API: ActressSearch  │
└────────────┬───────────────┘  └────────────┬──────────────┘
             │                                │
             ▼                                ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│ 6-1. 作品データ            │  │ 6-2. 女優データ            │
│ items = [                  │  │ actresses = [             │
│   {                        │  │   {                      │
│     content_id: 'atad00173',│  │     id: 1069632,         │
│     title: '...',          │  │     name: '石川澪',        │
│     ...                    │  │     ...                   │
│   },                       │  │   }                      │
│   {                        │  │ ]                        │
│     content_id: 'smcd00016',│ └───────────────────────────┘
│     ...                    │               │
│   }                        │               │ (型変換)
│ ]                          │               ▼
└────────────────────────────┘  ┌───────────────────────────┐
                                 │ 型変換                    │
                                 │ lib/dmm.ActressInfo       │
                                 │ → types/dmm.ActressInfo   │
                                 │ id: "1069632" → 1069632   │
                                 └───────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. 画面表示                                                  │
│    ItemCard × 2 (作品)                                       │
│    ActressCard × 1 (女優)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 技術的な詳細

### ID判定の仕組み

```typescript
function isActressId(id: string): boolean {
  return /^\d+$/.test(id);  // 正規表現: 先頭から末尾まで数字のみ
}
```

**判定例**:
- `"1069632"` → `/^\d+$/` にマッチ → `true` → 女優ID
- `"atad00173"` → `/^\d+$/` にマッチしない（文字を含む）→ `false` → 作品ID
- `"smcd00016"` → `/^\d+$/` にマッチしない（文字を含む）→ `false` → 作品ID

### 並列実行のメリット

**順次実行の場合**:
```typescript
// 遅い（合計 3秒）
const item1 = await fetchItemDetail('atad00173');  // 1秒
const item2 = await fetchItemDetail('smcd00016');  // 1秒
const actress = await fetchActressInfo('1069632'); // 1秒
```

**並列実行の場合**:
```typescript
// 速い（合計 1秒）
const [item1, item2] = await Promise.all([
  fetchItemDetail('atad00173'),
  fetchItemDetail('smcd00016'),
]);
const [actress] = await Promise.all([
  fetchActressInfo('1069632'),
]);
```

### エラーハンドリング

- **IDがない場合**: エラーメッセージを表示
- **API取得失敗**: 該当IDをスキップして、取得できたデータのみ表示
- **型変換エラー**: `parseInt()` でエラーが発生しても `undefined` として処理

---

## セキュリティとSEO

### robots設定

```typescript
robots: {
  index: false,  // 検索エンジンにインデックスしない
  follow: true,  // リンクはフォロー可能
}
```

**理由**: 共有URLは個人のリストなので、検索結果に表示されないようにする

### キャッシュ設定

- **作品データ**: 24時間キャッシュ（`revalidate: 86400`）
- **女優データ**: キャッシュなし（`cache: 'no-store'`）

---

## まとめ

1. **共有URL生成**: お気に入りIDをカンマ区切りでURLパラメータに設定
2. **URL解析**: Next.jsが自動デコードしてIDを取得
3. **ID分類**: 数字のみ → 女優ID、それ以外 → 作品ID
4. **並列取得**: `Promise.all()` で高速にデータ取得
5. **型変換**: DMM API形式からアプリケーション形式に変換
6. **表示**: 作品と女優を別セクションで表示

この仕組みにより、シンプルなURLでお気に入りリストを共有できます！

