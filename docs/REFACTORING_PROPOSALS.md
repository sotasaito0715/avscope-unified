# リファクタリング提案

このドキュメントでは、コードベースの改善のためのリファクタリング提案をまとめています。

## 1. 価格正規化ロジックの統合

### 問題点
- `src/lib/dmm.ts`に`normalizePriceString`関数が存在
- `src/lib/price-utils.ts`に`normalizePrice`関数が存在
- 同じ機能が2箇所で実装されており、保守性が低下

### 提案
1. `dmm.ts`の`normalizePriceString`を削除
2. `dmm.ts`で`price-utils.ts`の`normalizePrice`をインポートして使用
3. 価格正規化ロジックを`price-utils.ts`に一元化

### 影響範囲
- `src/lib/dmm.ts`の`normalizeItemPrices`関数
- 価格正規化を使用している全ての箇所

### メリット
- 単一責任の原則に準拠
- コードの重複を削減
- テストの一元化

---

## 2. ローカルストレージ操作の共通化

### 問題点
- `useFavorites.ts`と`useSearchHistory.ts`で同じパターンのローカルストレージ操作が繰り返されている
- エラーハンドリングやハイドレーション処理が重複

### 提案
1. `src/lib/storage.ts`を作成し、汎用的なローカルストレージ操作ユーティリティを実装
2. 以下の機能を提供：
   - `loadFromStorage<T>(key: string): T | null`
   - `saveToStorage<T>(key: string, data: T): void`
   - `removeFromStorage(key: string): void`
   - `clearStorage(key: string): void`
3. カスタムフック用の共通パターンを提供：
   - `useLocalStorage<T>(key: string, initialValue: T)`

### 実装例
```typescript
// src/lib/storage.ts
export function loadFromStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage`, error);
    return null;
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage`, error);
  }
}
```

### 影響範囲
- `src/hooks/useFavorites.ts`
- `src/hooks/useSearchHistory.ts`
- 将来的にローカルストレージを使用する他のフック

### メリット
- DRY原則の適用
- エラーハンドリングの統一
- テストの容易化

---

## 3. Headerコンポーネントの分割

### 問題点
- `src/components/Header.tsx`が350行以上と大きすぎる
- デスクトップ表示、モバイル表示、検索フォームなど複数の責務を持っている
- 保守性とテストの容易性が低下

### 提案
1. 以下のサブコンポーネントに分割：
   - `HeaderDesktop.tsx` - デスクトップ表示用
   - `HeaderMobile.tsx` - モバイル表示用
   - `SearchForm.tsx` - 検索フォーム（共通）
   - `MobileMenu.tsx` - モバイルメニュー
   - `Navigation.tsx` - ナビゲーションリンク

2. `Header.tsx`は統合コンポーネントとして残し、レスポンシブ表示を制御

### 構造例
```
src/components/Header/
  ├── Header.tsx (統合コンポーネント)
  ├── HeaderDesktop.tsx
  ├── HeaderMobile.tsx
  ├── SearchForm.tsx
  ├── MobileMenu.tsx
  └── Navigation.tsx
```

### メリット
- 単一責任の原則に準拠
- コンポーネントの再利用性向上
- テストの容易化
- コードの可読性向上

---

## 4. APIルートの共通化

### 問題点
- 複数のAPIルートで似たパターンのエラーハンドリング、認証チェック、キャッシュ設定が繰り返されている
- コードの重複と保守性の低下

### 提案
1. `src/lib/api-helpers.ts`を作成し、共通のAPIルートヘルパーを実装
2. 以下の機能を提供：
   - `withApiErrorHandling(handler: Function)` - エラーハンドリングラッパー
   - `validateApiCredentials()` - 認証情報の検証
   - `createCachedResponse(data: any, options: CacheOptions)` - キャッシュ付きレスポンス生成
   - `parseQueryParams(request: NextRequest)` - クエリパラメータのパース

### 実装例
```typescript
// src/lib/api-helpers.ts
export async function withApiErrorHandling<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  try {
    const credentials = getApiCredentials();
    if (!credentials) {
      return NextResponse.json(
        createCredentialsError(),
        { status: 401 }
      );
    }
    
    const data = await handler();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      createDmmApiError('API'),
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }
}
```

### 影響範囲
- `src/app/api/items/route.ts`
- `src/app/api/item/[cid]/route.ts`
- `src/app/api/actress/route.ts`
- その他のAPIルート

### メリット
- コードの重複削減
- エラーハンドリングの統一
- 保守性の向上

---

## 5. カスタムフックの共通パターン抽出

### 問題点
- `useFavorites`と`useSearchHistory`で似たパターンが繰り返されている
- ハイドレーション処理、状態管理、ローカルストレージ同期が重複

### 提案
1. `src/hooks/useLocalStorageState.ts`を作成し、汎用的なローカルストレージ連携フックを実装
2. 以下の機能を提供：
   - ハイドレーション処理
   - 状態管理
   - ローカルストレージとの自動同期
   - エラーハンドリング

### 実装例
```typescript
// src/hooks/useLocalStorageState.ts
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options?: {
    serializer?: (value: T) => string;
    deserializer?: (value: string) => T;
    onError?: (error: Error) => void;
  }
) {
  const [state, setState] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadFromStorage<T>(key);
    if (loaded !== null) {
      setState(loaded);
    }
    setIsHydrated(true);
  }, [key]);

  const updateState = useCallback((newValue: T | ((prev: T) => T)) => {
    setState(prev => {
      const value = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(prev)
        : newValue;
      saveToStorage(key, value);
      return value;
    });
  }, [key]);

  return [state, updateState, isHydrated] as const;
}
```

### 影響範囲
- `src/hooks/useFavorites.ts`
- `src/hooks/useSearchHistory.ts`

### メリット
- コードの重複削減
- 一貫した動作
- テストの容易化

---

## 6. 型定義の整理

### 問題点
- 型定義が複数のファイルに分散している可能性
- 型の重複定義や不整合のリスク

### 提案
1. 型定義の使用状況を調査
2. 共通の型は`src/types/`に集約
3. ドメイン固有の型は適切なディレクトリに配置
4. 型のエクスポートを整理し、循環参照を回避

### 確認が必要な型
- `DMMItem` - `src/lib/dmm.ts`と`src/types/dmm.ts`の整合性
- `ActressInfo` - 同様の整合性確認
- APIレスポンス型の統一

---

## 7. 定数の整理

### 問題点
- 定数が複数のファイルに分散している可能性
- マジックナンバーやハードコードされた値が存在

### 提案
1. `src/lib/constants.ts`を確認し、不足している定数を追加
2. 以下の定数を確認・追加：
   - キャッシュ期間（現在は`dmm.ts`にハードコード）
   - リトライ回数（現在は`useDataFetch.ts`にハードコード）
   - タイムアウト時間
   - ストレージキー（現在は各フックにハードコード）

### 影響範囲
- `src/lib/dmm.ts`
- `src/hooks/useDataFetch.ts`
- `src/hooks/useFavorites.ts`
- `src/hooks/useSearchHistory.ts`

---

## 8. エラーハンドリングの統一

### 問題点
- `src/lib/error-handler.tsx`が存在するが、全ての箇所で使用されていない可能性
- エラーハンドリングのパターンが統一されていない

### 提案
1. `error-handler.tsx`の使用状況を確認
2. 未使用の箇所があれば、統一されたエラーハンドリングを適用
3. APIルート、カスタムフック、コンポーネントで一貫したエラーハンドリングを実装

---

## 9. コンポーネントのパフォーマンス最適化

### 問題点
- 大きなコンポーネントで不要な再レンダリングが発生している可能性
- `useMemo`や`useCallback`の使用が不十分な箇所がある可能性

### 提案
1. React DevTools Profilerでパフォーマンスを分析
2. 以下の最適化を検討：
   - `React.memo`の適用
   - `useMemo`と`useCallback`の適切な使用
   - コンポーネントの分割による再レンダリング範囲の縮小

### 確認が必要なコンポーネント
- `ItemsList.tsx`
- `SearchResults.tsx`
- `Header.tsx`

---

## 10. テストの追加

### 問題点
- テストファイルが見当たらない
- リファクタリングの安全性を確保するため、テストが必要

### 提案
1. 重要なユーティリティ関数にユニットテストを追加
2. カスタムフックにテストを追加
3. コンポーネントに統合テストを追加

### 優先度の高いテスト対象
- `src/lib/price-utils.ts`
- `src/lib/storage.ts`（作成後）
- `src/hooks/useFavorites.ts`
- `src/hooks/useSearchHistory.ts`
- `src/lib/dmm.ts`

---

## 実装優先順位

### 高優先度
1. **価格正規化ロジックの統合** - 重複コードの削減
2. **ローカルストレージ操作の共通化** - コードの重複削減と保守性向上
3. **Headerコンポーネントの分割** - 可読性と保守性の向上

### 中優先度
4. **APIルートの共通化** - エラーハンドリングの統一
5. **カスタムフックの共通パターン抽出** - コードの重複削減
6. **定数の整理** - 保守性の向上

### 低優先度
7. **型定義の整理** - コードの品質向上
8. **エラーハンドリングの統一** - 一貫性の向上
9. **コンポーネントのパフォーマンス最適化** - パフォーマンス改善
10. **テストの追加** - 品質保証

---

## 注意事項

- リファクタリングは段階的に実施し、各ステップで動作確認を行う
- 大きな変更の前に、バックアップまたはブランチを作成
- リファクタリング後は、既存の機能が正常に動作することを確認
- パフォーマンスへの影響を測定

