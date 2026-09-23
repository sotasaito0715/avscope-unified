# API負荷の最適化提案

このドキュメントでは、API負荷に関する懸念点と改善提案をまとめています。

## 🚨 現在の懸念点

### 1. **`fetchItems` でキャッシュが無効化されている**

**問題点:**
- `src/lib/dmm.ts:250-251` で `cache: 'no-store'` と `revalidate: 0` が使用されている
- 全ての作品一覧取得でキャッシュが効かず、常にDMM APIを呼び出す

**影響:**
- `/` (トップページ)
- `/rankings`
- `/search`
- `/actress/[id]`
- その他 `fetchItems` を使用する全てのページ

**改善策:**
キャッシュを有効化して、24時間のキャッシュを活用する

---

### 2. **`RelatedActresses` コンポーネントでのフォールバック時の個別APIコール**

**問題点:**
- `src/components/RelatedActresses.tsx:63-79` で、まとめて取得に失敗した場合、個別にAPIコールを実行
- 女優が5人いる場合、フォールバック時は5回のAPIコールが発生

**影響:**
- `/item/[cid]` ページ（関連女優表示時）

**改善策:**
- フォールバック処理を削除、またはエラーを無視して空配列を返す
- まとめて取得できない場合は表示しない（API負荷を優先）

---

### 3. **CSRフックでの不要な再フェッチ**

**問題点:**
- `useItemsData` と `useActressData` で `JSON.stringify` を使用してパラメータを比較
- 参照が変わるだけで再フェッチが発生する可能性がある

**影響:**
- `/search` ページ
- その他CSRコンポーネントを使用するページ

**改善策:**
- パラメータの比較ロジックを改善
- デバウンス処理の追加（検索時など）

---

### 4. **`/api/actress` での複数ID処理**

**問題点:**
- `src/app/api/actress/route.ts:86-109` で、複数の女優IDがある場合、各IDに対して並列でリクエストを送っている
- 複数IDをまとめて1回のAPIコールにできない（DMM APIの制約）

**現状:**
- 内部では複数のリクエストが発生しているが、外部からは1回のAPIコールとして見える
- これはDMM APIの仕様上、最適化が困難

---

### 5. **`/api/items/details` での並列処理**

**問題点:**
- `src/app/api/items/details/route.ts:46-76` で、各作品IDに対して並列でDMM APIを呼び出している
- 作品数が多い場合、同時に多数のリクエストが発生する可能性

**改善策:**
- レート制限を追加（同時実行数を制限）
- または既存の `rateLimitedPromiseAll` を使用

---

## ✅ 改善提案（優先度順）

### 優先度: 高

#### 1. **`fetchItems` のキャッシュを有効化**

**現状:**
```typescript
const response = await fetch(url, {
  cache: 'no-store',
  next: { revalidate: 0 },
});
```

**改善案:**
```typescript
const response = await fetch(url, {
  next: { 
    revalidate: 86400, // 24時間キャッシュ
    tags: [`items-${JSON.stringify(params)}`], // パラメータごとにタグ付け
  },
});
```

**効果:**
- 同じパラメータでの検索は24時間キャッシュされる
- APIコール数を大幅に削減（50-90%の削減が見込める）

---

#### 2. **`RelatedActresses` のフォールバック処理を削除**

**現状:**
- まとめて取得に失敗した場合、個別に取得を試みる

**改善案:**
- エラー時は空配列を返すか、エラーを無視
- API負荷を優先し、表示は諦める

**効果:**
- フォールバック時の大量のAPIコールを防止
- 予期しない負荷を防ぐ

---

### 優先度: 中

#### 3. **`/api/items/details` にレート制限を追加**

**改善案:**
- 既存の `rateLimitedPromiseAll` を活用
- 同時実行数を3-5に制限

**効果:**
- DMM APIへの負荷を制御
- レート制限エラーを防止

---

#### 4. **CSRフックでのパラメータ比較ロジック改善**

**改善案:**
- `JSON.stringify` の代わりに、深い比較を使用
- または、パラメータのハッシュ化

**効果:**
- 不要な再フェッチを防止
- パフォーマンスの向上

---

#### 5. **検索時のデバウンス処理**

**改善案:**
- `useItemsData` と `useActressData` にデバウンス処理を追加
- ユーザーが入力中はAPIコールを抑制

**効果:**
- 連続した検索キーワード変更時のAPIコールを削減
- ユーザーエクスペリエンスの向上

---

### 優先度: 低

#### 6. **ページネーション時のキャッシュ活用**

**改善案:**
- 既に取得したページのデータをキャッシュ
- ページを戻る場合はAPIコールをスキップ

**効果:**
- ページネーション時の負荷削減

---

#### 7. **エラーハンドリングの改善**

**改善案:**
- APIエラー時のリトライ処理を最適化
- エラー時のキャッシュ戦略を改善

**効果:**
- 一時的なエラーによる無駄なAPIコールを防止

---

## 📊 改善効果の見積もり

| 改善項目 | 現在のコール数 | 改善後のコール数 | 削減率 |
|---------|--------------|----------------|--------|
| `fetchItems` キャッシュ有効化 | キャッシュなし（毎回） | 24時間キャッシュ | **50-90%** |
| `RelatedActresses` フォールバック削除 | 最大N回（N=女優数） | 1回（または0回） | **最大100%** |
| `/api/items/details` レート制限 | 無制限並列 | 3-5同時実行 | **負荷制御** |

---

## 🔧 実装方法

### 改善1: `fetchItems` のキャッシュ有効化

```typescript
// src/lib/dmm.ts
export async function fetchItems(params: FetchItemsParams = {}): Promise<{
  items: DMMItem[];
  total_count: number;
}> {
  // ... 既存のコード ...
  
  try {
    const response = await fetch(url, {
      next: { 
        revalidate: 86400, // 24時間キャッシュ
        tags: [
          'items',
          `items-${params.sort || 'rank'}`,
          params.keyword ? `items-keyword-${params.keyword}` : undefined,
          params.article_id ? `items-${params.article}-${params.article_id}` : undefined,
        ].filter(Boolean),
      },
    });
    // ... 残りのコード ...
  }
}
```

### 改善2: `RelatedActresses` のフォールバック削除

```typescript
// src/components/RelatedActresses.tsx
// フォールバック処理を削除
try {
  const response = await fetch(`/api/actress?actress_id=${actressIds}`);
  if (!response.ok) {
    setActresses([]); // エラー時は空配列
    return;
  }
  // ... 既存の処理 ...
} catch (error) {
  console.error('Failed to fetch actresses:', error);
  setActresses([]); // エラー時は空配列
}
```

### 改善3: `/api/items/details` にレート制限

```typescript
// src/app/api/items/details/route.ts
import { rateLimitedPromiseAll } from '@/lib/api-rate-limit';

// 各作品IDに対するタスクを作成
const itemTasks = ids.map((cid) => async () => {
  // ... 既存のDMM API呼び出し処理 ...
});

// レート制限付きで並列実行
const items = await rateLimitedPromiseAll(itemTasks, {
  maxConcurrency: 3,
  delay: 100,
});
```

---

## 📝 注意事項

1. **キャッシュの有効化**
   - 検索結果が24時間キャッシュされるため、最新性が求められる場合は注意
   - タグベースの再バリデーションを使用して、必要に応じて更新可能

2. **フォールバック処理の削除**
   - エラー時のユーザー体験が若干低下する可能性
   - しかし、API負荷を優先する場合は有効

3. **レート制限**
   - 同時実行数を制限することで、レスポンス時間が若干長くなる可能性
   - ただし、DMM APIの制約を考慮すると必要

---

## 🎯 推奨される実装順序

1. ✅ **`fetchItems` のキャッシュ有効化**（最も効果が大きい）
2. ✅ **`RelatedActresses` のフォールバック削除**（予期しない負荷を防止）
3. ✅ **`/api/items/details` にレート制限**（安全性向上）

これらの改善を実施することで、API負荷を大幅に削減できます。

