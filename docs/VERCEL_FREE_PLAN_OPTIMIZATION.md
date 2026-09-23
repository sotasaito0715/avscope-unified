# Vercel無料プラン制限対策 - 最適化ガイド

## 📊 現在の制限超過状況

以下のリソースがVercel無料プランの制限を超えています：

1. **Image Optimization - Transformations**: 311K (制限: 5K) - **62倍超過**
2. **Image Optimization - Cache Writes**: 2.4M (制限: 100K) - **24倍超過**
3. **Fluid Active CPU**: 56h 38m (制限: 4h) - **14倍超過**
4. **Fast Origin Transfer**: 84.66 GB (制限: 10 GB) - **8.5倍超過**
5. **Function Invocations**: 5.2M (制限: 1M) - **5.2倍超過**
6. **Edge Requests**: 4.1M (制限: 1M) - **4.1倍超過**
7. **Fluid Provisioned Memory**: 404.1 GB-Hrs (制限: 360 GB-Hrs) - **1.1倍超過**

## 🎯 実施した最適化

### 1. OGP画像のキャッシュ強化

**変更内容:**
- OGP画像生成をEdge RuntimeからNode.js Runtimeに変更
- 24時間のISR（Incremental Static Regeneration）を設定
- `revalidate = 86400`を追加

**対象ファイル:**
- `src/app/articles/[slug]/opengraph-image.tsx`
- `src/app/actress/[id]/opengraph-image.tsx`
- `src/app/item/[cid]/opengraph-image.tsx`

**効果:**
- Edge Requestsの大幅削減（約90%削減見込み）
- OGP画像の生成回数削減

### 2. サイトマップのキャッシュ強化

**変更内容:**
- すべてのサイトマップファイルで`force-dynamic`を削除
- ISR（Incremental Static Regeneration）を24時間に設定
- HTTPキャッシュヘッダーを24時間に延長（stale-while-revalidate: 48時間）

**対象ファイル:**
- `src/app/sitemap.ts`
- `src/app/sitemap-articles.xml/route.ts`
- `src/app/sitemap-actresses.xml/route.ts`
- `src/app/sitemap-categories.xml/route.ts`
- `src/app/sitemap-items.xml/route.ts`
- `src/app/sitemap-index.xml/route.ts`

**効果:**
- Function Invocationsの大幅削減（約95%削減見込み）
- サイトマップ生成のCPU使用量削減

### 3. 画像最適化の無効化確認

**現在の設定:**
- `next.config.ts`で`images.unoptimized: true`が設定済み
- すべての`next/image`コンポーネントで画像最適化が無効化されている

**注意点:**
- Image Optimizationの使用量が高いのは、過去の使用量が残っている可能性があります
- 来月以降は使用量が0になるはずです

## 📈 期待される効果

### Function Invocations（5.2M → 目標: 1M以下）

**削減見込み: 約80-90%**

- サイトマップのISR化により、毎回の動的生成を回避
- 24時間キャッシュにより、同じリクエストは関数を実行しない

### Edge Requests（4.1M → 目標: 1M以下）

**削減見込み: 約75-85%**

- OGP画像のEdge RuntimeからNode.js Runtimeへの変更
- 24時間キャッシュにより、同じOGP画像は再生成しない

### Fast Origin Transfer（84.66 GB → 目標: 10 GB以下）

**削減見込み: 約50-70%**

- サイトマップとOGP画像のキャッシュ強化により、同じコンテンツの再転送を削減
- 静的アセットの長時間キャッシュ（既に設定済み）

### Fluid Active CPU（56h 38m → 目標: 4h以下）

**削減見込み: 約70-85%**

- サイトマップのISR化により、毎回の動的生成を回避
- OGP画像のキャッシュ強化により、再生成を削減

### Image Optimization（311K → 目標: 5K以下）

**削減見込み: 100%**

- `images.unoptimized: true`により、画像最適化が完全に無効化されている
- 来月以降は使用量が0になるはずです

## ⚠️ 追加で検討すべき最適化

### 1. APIルートのキャッシュ時間延長

現在、APIルートは24時間キャッシュされていますが、さらに延長を検討：

```typescript
// 現在: 24時間
'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800'

// 提案: 48時間（変更頻度が低いデータの場合）
'Cache-Control': 'public, s-maxage=172800, stale-while-revalidate=345600'
```

### 2. 静的生成（SSG）の活用

可能な限り静的生成を活用：

- 記事ページ: 既に`generateStaticParams`を使用
- 女優ページ: 静的生成を検討
- 商品ページ: 人気商品のみ静的生成を検討

### 3. ページレベルのISR設定

動的ページにISRを設定：

```typescript
export const revalidate = 86400; // 24時間
```

### 4. 外部画像のCDNキャッシュ

DMMの画像を直接使用している場合、CDNキャッシュを活用：

```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/image-proxy/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
}
```

## 📊 モニタリング

### Vercelダッシュボードで監視すべき指標

1. **Function Invocations**: 月間1M以下を目標
2. **Edge Requests**: 月間1M以下を目標
3. **Fast Origin Transfer**: 月間10 GB以下を目標
4. **Fluid Active CPU**: 月間4h以下を目標
5. **Image Optimization**: 月間5K以下を目標（来月以降は0になるはず）

### アラート設定

Vercelダッシュボードで以下のアラートを設定することを推奨：

- Function Invocations: 800K（制限の80%）
- Edge Requests: 800K（制限の80%）
- Fast Origin Transfer: 8 GB（制限の80%）
- Fluid Active CPU: 3.2h（制限の80%）

## 🔄 継続的な最適化

### 月次レビュー

毎月、以下の項目を確認：

1. Vercelダッシュボードでのリソース使用量
2. キャッシュヒット率
3. パフォーマンスメトリクス
4. ユーザー体験への影響

### 最適化の優先順位

1. **最優先**: Function InvocationsとEdge Requestsの削減
2. **高優先**: Fast Origin TransferとFluid Active CPUの削減
3. **中優先**: Image Optimizationの完全無効化確認

## 📝 まとめ

### 実施した最適化

✅ OGP画像のキャッシュ強化（24時間ISR）
✅ サイトマップのキャッシュ強化（24時間ISR）
✅ 画像最適化の無効化確認

### 期待される効果

- **Function Invocations**: 約80-90%削減
- **Edge Requests**: 約75-85%削減
- **Fast Origin Transfer**: 約50-70%削減
- **Fluid Active CPU**: 約70-85%削減
- **Image Optimization**: 100%削減（来月以降）

### 次のステップ

1. 来月の使用量を監視
2. 必要に応じて追加の最適化を実施
3. 有料プランへの移行を検討（最適化後も制限を超える場合）

---

最終更新: 2025-01-XX

