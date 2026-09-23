# マスタープロンプト：hentaitok記事生成（Cursor用）

## 概要
このプロンプトは、hentaitok用のAVランキング記事を自動生成するための手順書です。DMM/FANZA APIからデータを取得し、VR作品を除外し、許可メーカーのみをフィルタリングして、SEO最適化された記事を作成します。

**重要**: 記事生成時は必ず以下のフォーマット要件を遵守すること：
1. **マークダウン形式**: 記事本文は必ずマークダウン形式（#、##、###、####を使用）で生成
2. **ランキング項目のフォーマット**: `### 1位` または `### 第2位：` 形式、引用情報を含む
3. **画像形式**: `![サンプル画像1](url)` 形式を使用
4. **評価表示**: リスト形式（`- ◆①フェチズム：★★★★★`）を使用
5. **おすすめポイント**: `#### おすすめポイント` 形式を使用
6. **定型プロフィール情報の禁止**: 身長、スリーサイズ、おっぱいのハリ、肌、フェチ度などの定型プロフィール情報は使用しない。作品の内容や特徴、女優の演技に基づく自然なコメントのみを使用
7. **お気に入り登録数の記載禁止**: お気に入り登録数は記載しない
8. **FANZA情報の取得**: すべてのランキング項目についてFANZA情報を取得し、それに基づいておすすめポイントを生成
9. **featuredImageとimagesの追加**: 記事オブジェクトにfeaturedImageとimagesを追加

**重要**: このプロンプトを使用して記事生成を行う際、生成されるすべてのファイル（APIレスポンスJSON、記事生成スクリプト、生成された記事ファイルなど）は、`ohsawa`フォルダ内に格納してください。

---

## 1. 必要な情報の確認
記事生成に必要な情報をユーザーから取得：

1. **`{keyword}`**: 記事化したいジャンルやニーズ（例：ぽっちゃり、黒ギャル、人妻、女上司 など）
2. **ランキング種別**: A：AV名作ランキング（作品）／B：AV女優ランキング（人物） ※未指定ならAで処理
3. **近似キーワード使用可否**: `{keyword}` がヒットしない時に「近いキーワードを自動で探して採用してよいか」 … Y/N

---

## 2. 固定設定

### API設定
- **API_ID**: `tmuYYhApYPz2LaGknMun`
- **AFFILIATE_ID**: `masaeng-990`
- **ItemList APIエンドポイント**: `https://api.dmm.com/affiliate/v3/ItemList`
- **ActressSearch APIエンドポイント**: `https://api.dmm.com/affiliate/v3/ActressSearch`
- **サイト**: `FANZA`
- **サービス**: `digital`
- **フロア**: `videoa`
- **取得件数**: `100件`
- **ソート**: `rank`

### VR作品の除外
- **ジャンル名に「VR」が含まれる作品は自動除外**（例：VR専用、ハイクオリティVR、8KVR）
- **タイトルに「VR」「【VR】」が含まれる作品も自動除外**

### 許可メーカーリスト
以下のメーカーのみを利用して記事を作成。メーカーの絞り込みは、APIを叩いてファイルを取得した後に実施する。

```
Aircontrol, BeFree, E-BODY, Fitch, HHH,
kawaii*, kira☆kira, MVG, OPERA, OPPAI,
ROOKIE, Ｖ, アタッカーズ, えむっ娘ラボ, ダスッ！,
NPJ(旧：ナンパJAPAN), はじめ企画, ビビアン, ワンズファクトリー,
痴女ヘヴン, 変態紳士倶楽部, 本中, 未満, 無垢, 溜池ゴロー,
#ｼﾛｳﾄ逸材発掘～仕事帰りのﾔﾘもくちゃんSSR, #職業女子,
Buzzシロウト, GO！GO！お手当ちゃん, MOON LIGHTING, ギャルpay,
しろうとエチチ.ch, しろうとヤッホー, しろうと屋, チョロすぎQ,
ニュージェネ, ねっとりフリックス, 巨乳は飲み物。, 新世代女子,
神級ビッチ, 素人ごっそ, 素人ぱいぱい, 素人天然水, 素人盗撮倶楽部,
東京恋マチ女子, 東狂ハメンジャーズ, 肉女子キュンキュン♪, 日払いちゃん,
素人ムクムク, ＃シロウト逸材発掘, 素人ぷるるん, 職業女子,
素人ムクムク 夢中, 路地裏ぱんぱん, シロウト速報, 素人ムクムク-塩-,
素人盗撮俱楽部, 素人ChuChu, 素人ムクムク-夢中-, 裏垢ドットえす,
アイデアポケット, PREMIUM, Madonna, マドンナ, MOODYZ,
グローバルメディアエンタテインメント, グローバルメディアアネックス,
桃太郎映像出版, バビロン/妄想族, ニイハオサイコウ/妄想族,
全日本カメコ協同組合/妄想族, KSB企画/エマニエル, イノセント/妄想族,
ドグマ, こぐま/妄想族, 綜実社/妄想族, コレ彦/妄想族, コレ彦,
かつお物産/妄想族, ゲインコーポレーション, 堅者の食卓/妄想族,
AVS collector's, 美人魔女/エマニエル, アイドリ/妄想族, 稀（まれ）/妄想族,
BabyEntertainment, アクアモール/エマニエル, 有閑ミセス/エマニエル,
熟女塾/エマニエル, スパルタン/妄想族, ABC/妄想族, TEPPAN,
縦動画プロジェクト, ぽかぽか/妄想族, HYBRID映像/妄想族,
かぐや姫Pt/妄想族, ミセスの素顔/エマニエル, LOVEま○こ/妄想族,
まんげつ/妄想族, Vrevo, 姦乱者/妄想族, バルタン, SEX Agent/妄想族,
ZETTON, Pandora/エマニエル, ILLEGAL＜イリーガル＞/妄想族,
人妻援護会/エマニエル, VENUS, 熟女JAPAN,
ハメドリネットワークSecondEdition, パーフェクトコミュニケーションズ,
BRAVO, 平日14時の発情妻たち, ヒプノシスラボ/妄想族, 熟道,
h.m.p DORAMA, アロマ企画, 大塚フロッピー, ケチャラパチャラ/妄想族,
マックスエー, HyakkinTV, MAX-Aレジェンド, ION/妄想族,
アリスJAPAN, Smartmedia production/妄想族, PETSHOP/妄想族,
ミル, private mask/妄想族, Asia/妄想族, DIVA/妄想族,
P-BOX VR, 毒宴会, 4K VR, MONDELDE VR, 肉盛,
Cosmo Planets VR, クレイジーウォーカー, VR buz, キネマ座,
通勤快速, フェラすぺ, 生ハメ素人ch, こすパコハメ撮りおじさん,
KMPVR-彩-, 犬/妄想族, うさぎ/妄想族, ビッグ・ザ・肉道/妄想族,
イルカ/エマニエル, グローリークエスト, グローリークエストVR,
ヒプノシスRASH, 煩悩組/妄想族, 催●RED, 人妻文化センター/エマニエル,
ディープス, 激レア素人ちゃん, STUDIO I's/妄想族,
AMATEUR BOX/妄想族, 軟派舎/妄想族, BRAVO/ミスターインパクト,
unfinished, MARRION, しろうとがーる/妄想族, S-Cute,
下半身タイガース/妄想族, レアルワークス, 僕たち男の娘, 宇宙企画,
ケイ・エム・プロデュース, BAZOOKA, メディアステーション,
パコパコ団とゆかいな仲間たち/妄想族, 山と空/妄想族, KMPVR-bibi-,
スクープ, S級素人, V＆R PRODUCE, なでしこ, エロタイム, Z-MEN,
NAGIRA, ヒメゴト, RADICAL-KMPVR-, GIGOLO（ジゴロ）, 椿鳳院,
ステルス, ナンパHEAVEN, むちゃぶりTV, サロメ, 地雷系女子,
ルーナ旬香舎, 令和四天王, 東京恋人, スリーサウザンド, 忍,
タイガーマイスターズ, 新世紀文藝社, マダムス, トップマーシャル,
REAL VR-Neo-, 300 Three Hundred, カメラ小僧, エロガチャ,
絆書房, 初めてのAV出演, これすこ。, バリカワ, B級熟女選手権,
HEAVEN, 日本藝術浪漫文庫, 刺激ストロング, 港区女子,
THE BEST OF 3DVR, 日本近代ロマン書房, 世田谷VR, ＆RiBbON,
アダム書房, ボリューミー, S級素人VR -DX-, 裸王, 横浜かまちょ,
スカッド, ナタリー文庫, 月刊盗撮現代, VRスタジアム, 俺の素人,
ゲリラ, ゾクゾク娘/妄想族, レインボー/妄想族, GALDQN/妄想族,
B-hole/エマニエル, EROTICA, アップス, カルマ,
熟女はつらいよ/熟女卍, 熟女大学/熟女卍, 素人まっちんぐEX/妄想族,
ゑびすさん/妄想族, ゆりえっち/妄想族, 熟の蔵/エマニエル, FAプロ,
ジェントルマン/妄想族, 新セカイ/妄想族, MUTEKI, S1,
濡壺/妄想族, キチックス/妄想族, 乳と母/エマニエル,
Lady Boy/妄想族, 肉厚食堂/妄想族, 幼獄LiTE/妄想族,
ちぃぱいペチャ子/妄想族, カウカウパラダイス/妄想族,
おっぱいデカ美/妄想族, CREAM SODA/妄想族, 宝石箱/妄想族,
苺一会/妄想族, ルネピクチャーズ, 豊彦, DOC, SUKEKIYO,
しろうとまんまん, ハメタバース, 独占ちゃん, MOON FORCE,
ドキュメントdeハメハメ, ナンパdeハメハメ, しろーとLOVETube,
ゲスヤミ, バレマンッ！！/妄想族
```

**注意**: メーカー名のマッチングは柔軟に行う（完全一致、部分一致、カタカナ/英語変換対応）

---

## 3. 作業手順

### ステップ1: キーワードからgenre_idを取得
1. `data/genres/genres_summary.json`を読み込む（`ohsawa`フォルダから見た相対パスで`../assets/tags/allTags.json`）
2. `{keyword}`と一致するまたは部分一致するgenre_nameを検索
3. 該当するgenre_idを取得
4. 見つからない場合、ユーザーに確認するか、近似キーワード（allowSimilar=Yの場合）を試す
5. **重要**: 取得したgenre_idは変数`genreId`に格納し、ステップ8の記事本文生成テンプレート内のhentaitok紹介セクションで使用する（リンクURL: `https://hentai-tok.com/video/genre/${genreId}`）

### ステップ2: DMM APIからデータを取得
1. 以下の形式でAPIを呼び出す：
```
https://api.dmm.com/affiliate/v3/ItemList?api_id=tmuYYhApYPz2LaGknMun&affiliate_id=masaeng-990&site=FANZA&service=digital&floor=videoa&hits=100&offset=1&sort=rank&article[0]=genre&article_id[0]={genre_id}&output=json
```

2. 取得したJSONデータを`ohsawa/response-{keyword}-{genre_id}.json`として保存（必ず`ohsawa`フォルダ内に保存）

3. 0件の場合：
   - allowSimilar=Yの場合、同系語・上位語・類似タグを1〜3件試し、**もっともヒットが多いものを自動採用**
   - allowSimilar=Nの場合、ユーザーに確認

### ステップ3: VR作品の除外
1. 取得したJSONからitemsを抽出
2. 各itemの`iteminfo.genre[]`を確認し、ジャンル名に「VR」が含まれるものを除外
3. タイトルに「VR」「【VR】」が含まれるものも除外
4. 除外された件数をログ出力

### ステップ4: メーカーフィルタリング
1. VR除外後のitemsを抽出
2. 各itemの`iteminfo.maker[0].name`を取得
3. 許可メーカーリストと照合（柔軟なマッチング：完全一致、部分一致、カタカナ/英語変換）
4. 許可されたメーカーのみを残す
5. 10件未満の場合：下位のランキングを検索するか、類似キーワードで検索。そのまま記事は出すが「※該当が少なかったため本数を絞っています」と注記

### ステップ5: ランキング抽出

#### ランキングA（AV名作ランキング）の場合：
- itemsを「取ってきた順（=rank）」で見て上から最大10件
- 各itemで必要なもの：
  - `title`
  - `content_id`
  - `affiliateURL`（なければ`URL`相当）
  - `sampleImageURL.sample_l.image`または`sampleImageURL.sample_s.image`または`imageURL.large`
  - `iteminfo.maker[0].name`
  - `iteminfo.actress[0]`（女優情報取得用）
- 画像があったら、上位3枚までを`[画像識別用タグ](https://...)`として本文の中に入れる
- **各作品の主な女優（`iteminfo.actress[0]`）のIDを取得し、ActressSearch APIで詳細情報を取得**

#### ランキングB（AV女優ランキング）の場合：
- `items[].iteminfo.actress[]` を全走査して女優IDごとに出演数をカウント
- 単独出演(`iteminfo.actress.length == 1`)がある女優は加点
- 上位10名を並べ、各女優に対して：
  - 女優名
  - 女優ID
  - 出演本数
  - 単独作にサンプル画像があれば `[画像識別用タグ](url)` で並べる
  - 女優直リンク：`https://video.dmm.co.jp/av/list/?actress={女優ID}`

### ステップ6: 女優情報の取得
1. 各ランキング項目の主な女優（`iteminfo.actress[0]`）のIDを取得
2. ActressSearch APIを呼び出し：
```
https://api.dmm.com/affiliate/v3/ActressSearch?api_id=tmuYYhApYPz2LaGknMun&affiliate_id=masaeng-990&actress_id={actress_id}&output=json
```
3. 取得した情報から以下を抽出：
   - `name`（女優名）
   - `height`（身長）
   - `bust`（バスト）
   - `cup`（カップ）
   - `waist`（ウエスト）
   - `hip`（ヒップ）
   - `birthday`（生年月日、デビュー年推定用）

### ステップ6.5: FANZAページから紹介文とレビューを取得（全順位必須・各順位ごとに異なる内容）
**重要**: すべてのランキング項目（1位〜10位）について、FANZAページから紹介文とレビューを取得し、**各順位ごとに異なる内容**のSEO最適化されたおすすめポイントを生成する。

1. **FANZA情報取得スクリプトの使用**
   - `ohsawa/fetch-fanza-content.js`または`ohsawa/fetch-and-generate-{keyword}-reviews.js`を使用して各作品のFANZAページから情報を取得（スクリプトは`ohsawa`フォルダ内に配置）
   - 各ランキング項目の`affiliateURL`から実際のFANZA URLを抽出
   - Playwrightを使用して年齢確認を突破し、ページにアクセス

2. **取得する情報**
   - 作品の紹介文（あらすじ、シチュエーション、セリフ、特徴など）**必須**
   - 収録時間
   - ユーザーレビュー**必須**（基本あらすじとユーザー評価は存在するため、確実に取得する）
   - **注意**: お気に入り登録数は取得しても使用しない（記載禁止）

3. **あらすじの抽出（再試行機能付き）**
   - **重要**: セレクターが反応しなかった場合、複数回再試行する（最大3回）
   - ページのスクロールを実施して動的コンテンツの読み込みを待つ
   - 段階的なセレクター戦略を採用：
     - **段階1**: 主要なセレクター（`.tx-hangaku`, `.tx-detail`, `.detail-txt`, `.product-description`, `[class*="description"]`, `[id*="description"]`など）を試す
     - **段階2**: ページ全体から長いテキスト（200文字以上3000文字以下）を探し、作品に関連するキーワードを含むものを抽出
   - 除外要素（キャンペーン、広告、メニュー、ヘッダー、フッターなど）の子要素は除外
   - 取得したFANZA情報から不要な部分（配信方法の注意書き、対応デバイス、配信開始日など）を除外
   - 作品の内容を説明している部分（100文字以上、作品の特徴を含む）を抽出
   - セリフ（「」で囲まれた部分）を抽出
   - 再試行時はページを再読み込みし、待機時間を設ける

4. **レビューの抽出（再試行機能付き）**
   - **重要**: セレクターが反応しなかった場合、複数回再試行する（最大3回）
   - 段階的なセレクター戦略を採用：
     - **段階1**: 主要なレビューセレクター（`.d-review__item`, `.d-review__text`, `.review-item`, `[class*="review"]`, `[id*="review"]`など）を試す
     - **段階2**: ページ全体からレビューらしいテキスト（30文字以上500文字以下）を探し、レビューキーワード（「良い」「最高」「おすすめ」「満足」「評価」「星」など）を含むものを抽出
   - 除外要素（キャンペーン、広告、メニューなど）の子要素は除外
   - レビューキーワードを含み、除外キーワード（「ログイン」「会員登録」「購入」「カート」など）を含まないテキストを抽出
   - 重複を避けるため、既に取得したテキストは除外
   - 再試行時は待機時間を設ける

5. **各順位ごとに異なるおすすめポイントの生成**
   - **重要**: 各順位ごとに異なる内容のレビューを生成する
   - 順位に応じた特徴的な表現を使用（例：1位は「最大の見どころ」、2位以降は順位ごとに異なる表現）
   - FANZAから取得したあらすじの内容を基に、作品の具体的なシチュエーション、セリフ、特徴を自然に組み込む
   - 収録時間などの数値を追加（お気に入り登録数は記載しない）
   - キーワード（女優名、ジャンル、シチュエーションなど）を自然に配置
   - **重要**: 定型のプロフィール情報（身長、スリーサイズ、おっぱいのハリ、肌、フェチ度など）は使用しない。作品の内容や特徴、女優の演技に基づく自然なコメントのみを使用する

6. **実装例（各順位ごとに異なる内容を生成・再試行機能付き）**
```javascript
// 各ランキング項目についてFANZA情報を取得し、順位ごとに異なるレビューを生成
async function generateDetailedReviews(rankingItems, keyword) {
  const reviews = {};
  
  for (const item of rankingItems) {
    const rank = rankingItems.indexOf(item) + 1;
    const affiliateURL = item.affiliateURL || item.URL || '';
    
    if (affiliateURL) {
      console.log(`${rank}位のFANZA情報を取得中...`);
      const fanzaInfo = await fetchFanzaContent(affiliateURL);
      
      if (fanzaInfo) {
        // あらすじを抽出（不要な部分を除外）
        const description = extractDescription(fanzaInfo.description);
        
        // 順位ごとに異なるSEO最適化されたレビューを生成
        const review = generateSEOReview(item, fanzaInfo, keyword, rank);
        reviews[item.content_id] = review;
      }
    }
    
    // 次のリクエスト前に少し待つ（サーバー負荷を考慮）
    if (rank < rankingItems.length) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return reviews;
}

// あらすじを抽出する関数（改良版）
function extractDescription(text) {
  if (!text) return null;
  
  // 不要な部分を除外（より包括的に）
  const excludePatterns = [
    /【妄想族.*?】/g,
    /【桃太郎映像出版.*?】/g,
    /【準新作】/g,
    /【最新作】/g,
    /【新作】/g,
    /【.*?％OFF.*?】/g,
    /\d+円〜/g,
    /特集.*?$/g,
    /最新作やセール商品.*?$/g,
    /お得な情報満載.*?$/g,
    /ライブチャット.*?$/g,
    /若妻・熟女と楽しめる.*?$/g,
    /※配信方法によって.*?ください。/g,
    /お気に入り登録数.*?\n/g,
    /対応デバイス：.*?\n/g,
    /配信開始日：.*?\n/g,
    /商品発売日：.*?\n/g,
    /収録時間：.*?\n/g,
    /出演者：.*?\n/g,
    /監督：.*?\n/g,
    /シリーズ：.*?\n/g,
    /メーカー：.*?\n/g,
    /レーベル：.*?\n/g,
    /ジャンル：.*?\n/g,
    /関連タグ.*?\n/g,
    /配信品番：.*?\n/g,
    /メーカー品番：.*?\n/g,
    /平均評価：.*?\n/g
  ];
  
  let cleaned = text;
  excludePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // あらすじらしい部分を抽出（長い文章で、作品の内容を説明している部分）
  const lines = cleaned.split('\n').filter(line => {
    const trimmed = line.trim();
    // 短すぎる行や長すぎる行は除外
    if (trimmed.length < 50 || trimmed.length > 2000) return false;
    
    // 除外キーワードを含む行は除外（価格情報、キャンペーン情報など）
    const excludeKeywords = [
      'キャンペーン', 'ポイント', 'プレゼント', '申し込み', 'カード', '審査', '特典', 
      'ログイン', '会員登録', '購入', 'カート', '対応デバイス', '配信開始日', 
      '商品発売日', '出演者', '監督', 'シリーズ', 'メーカー', 'レーベル', 'ジャンル', 
      '関連タグ', '配信品番', 'メーカー品番', '平均評価', '特集', 'ライブチャット', 
      'サンプル画像', '最新作やセール商品', 'お得な情報満載', 'OPPAI', '本中',
      '350円', '210円', '1,480円', '2,480円', '520円', '500円', '300円'
    ];
    // 短い行で除外キーワードを含む場合は除外（価格情報など）
    if (excludeKeywords.some(keyword => trimmed.includes(keyword) && trimmed.length < 200)) return false;
    
    // 作品の内容らしいキーワードを含む行を抽出（ジャンルに応じて調整）
    const includeKeywords = [
      '日焼け', 'ギャル', '黒', '巨乳', '中出し', '犯', '痴女', 'NTR', '密着', 
      '人妻', '家出', '敏感', '乳首', '失禁', '生パコ', 'オッパイ', '挟まれ', 
      '濡れ透け', 'ヌル乳', '黒ギャル', 'ヤリマン', '子宮', 'レンタル', 'バイト', 
      'オヤジ', '交尾', 'テクニシャン', 'ちんしこ', 'チクビ', '悶絶', '漆黒', 
      'カリスマ', '鬼ギャル', 'ベスト', '結婚', '夫', '妻', '温泉', '旅行', 
      '披露宴', '相部屋', '花火', '幼馴染', '雨宿り', '娘婿', '和服', '浴衣',
      '新体操', 'チア', 'ダンス', '全国レベル', 'Gcup', '巨乳ギャル', '舌ピアス',
      'ビキニ', '日焼けあと', 'シルバーアッシュ', 'ローション', 'ムッチリ', 'Gカップ',
      'ヌルヌル', '性交', 'スケスケ', '濡れた着衣', '勃起乳首', 'ネチョネチョ',
      '揉まれて', '悶絶エクスタシー', 'パイズリ', '挟射', '3Pセックス', 'サーファー',
      'つまみ喰い', 'AV男優', '生・中', '中出し解禁', '小麦色', 'マンコ', '白濁精子',
      '日サロ', '偽装工作', 'スケベ人妻'
    ];
    const hasIncludeKeyword = includeKeywords.some(keyword => trimmed.includes(keyword));
    
    return hasIncludeKeyword;
  });
  
  // 最も長い行を返す（あらすじらしい）
  if (lines.length > 0) {
    lines.sort((a, b) => b.length - a.length);
    return lines[0].trim();
  }
  
  return null;
}

// タイトルからキーワードを抽出する関数（あらすじがない場合のフォールバック用）
function extractKeywordsFromTitle(title, keyword) {
  const keywords = [];
  
  // タイトルから特徴的なキーワードを抽出（ジャンルに応じて調整）
  if (title.includes('田舎')) keywords.push('田舎');
  if (title.includes('家出')) keywords.push('家出ギャル');
  if (title.includes('ギャル妹') || title.includes('妹')) keywords.push('ギャル妹');
  if (title.includes('黒ギャル')) keywords.push('黒ギャル');
  if (title.includes('巨乳') || title.includes('Gcup') || title.includes('Hカップ') || title.includes('爆乳')) keywords.push('巨乳');
  if (title.includes('人妻')) keywords.push('人妻');
  if (title.includes('中出し')) keywords.push('中出し');
  if (title.includes('敏感') || title.includes('乳首')) keywords.push('敏感乳首');
  if (title.includes('失禁')) keywords.push('失禁');
  if (title.includes('生パコ')) keywords.push('生パコ');
  if (title.includes('オッパイ') || title.includes('ヌル乳') || title.includes('挟まれ')) keywords.push('巨乳密着');
  if (title.includes('濡れ透け')) keywords.push('濡れ透け');
  if (title.includes('密着')) keywords.push('密着');
  if (title.includes('ヤリマン')) keywords.push('ヤリマン');
  if (title.includes('子宮レンタル') || title.includes('レンタルバイト')) keywords.push('子宮レンタル');
  if (title.includes('女子大生')) keywords.push('女子大生');
  if (title.includes('テクニシャン') || title.includes('ちんしこ') || title.includes('チクビ')) keywords.push('ドSテクニシャン');
  if (title.includes('鬼ギャル') || title.includes('漆黒') || title.includes('カリスマ')) keywords.push('鬼ギャル');
  if (title.includes('ベスト') || title.includes('24発')) keywords.push('ベスト');
  if (title.includes('エンドレス') || title.includes('8時間')) keywords.push('エンドレス');
  if (title.includes('新体操') || title.includes('チア') || title.includes('ダンス')) keywords.push('新体操');
  if (title.includes('黒尻') || title.includes('Tバック')) keywords.push('黒尻');
  if (title.includes('和服') || title.includes('浴衣')) keywords.push('和服・浴衣');
  
  const uniqueKeywords = [...new Set(keywords)];
  const filteredKeywords = uniqueKeywords.filter(k => k !== keyword);
  
  if (filteredKeywords.length === 0) {
    // フォールバック: タイトルから単語を抽出
    const titleWords = title.split(/[・！？。、\s]/).filter(word => 
      word.length > 1 && 
      !word.includes('AV') && 
      !word.includes('デビュー') &&
      word !== keyword
    );
    if (titleWords.length > 0) {
      filteredKeywords.push(titleWords[0]);
    }
  }
  
  return filteredKeywords.length > 0 ? filteredKeywords[0] : null;
}

// SEO最適化されたレビューを生成する関数（順位ごとに異なる内容・あらすじを基に生成）
function generateSEOReview(item, fanzaInfo, keyword, rank) {
  const { title, actress, maker } = item;
  const description = extractDescription(fanzaInfo?.description || '');
  const volume = extractVolume(fanzaInfo?.description || '') || fanzaInfo?.volume || '';
  
  // タイトルからキーワードを抽出（あらすじがない場合のフォールバック用）
  const titleKeyword = extractKeywordsFromTitle(title, keyword);
  
  // SEO最適化されたレビューを生成（各順位ごとに異なる内容）
  let review = '';
  
  // 1. 作品の概要（あらすじを基に、各順位ごとに異なる表現）
  if (description && description.length > 50) {
    // あらすじから実際の作品内容を抽出（関連作品のリストを除外）
    let descSummary = description;
    
    // 関連作品のリストを除外（「蘭華\n【妄想族...」のような形式）
    const lines = descSummary.split('\n');
    const contentLines = lines.filter(line => {
      const trimmed = line.trim();
      // 短い行や価格情報を含む行を除外
      if (trimmed.length < 50) return false;
      if (trimmed.match(/\d+円〜/)) return false;
      if (trimmed.match(/【.*?％OFF.*?】/)) return false;
      if (trimmed.match(/【.*?新作.*?】/)) return false;
      if (trimmed.match(/【.*?準新作.*?】/)) return false;
      // 作品の内容らしいキーワードを含む行を優先
      const includeKeywords = ['ヤリマン', 'セフレ', '魔性', 'スケ水着', 'マロン', '黒ギャル', 'オイル', 'テッカテカ', '吸い付き', 'フェラ', '搾精', '高速ピストン', '悶えて', 'ガクガク', '震えイキ', '暴発', '新体操', 'チア', 'ダンス', '全国レベル', 'ローション', 'ヌルヌル', '性交', 'サーファー', '中出し解禁', '人妻'];
      return includeKeywords.some(k => trimmed.includes(k));
    });
    
    if (contentLines.length > 0) {
      descSummary = contentLines[0].trim();
      if (descSummary.length > 300) {
        descSummary = descSummary.substring(0, 300) + '...';
      }
    } else {
      // フォールバック: 元の説明文から長い部分を抽出
      const longLines = lines.filter(line => line.trim().length > 100 && line.trim().length < 500);
      if (longLines.length > 0) {
        descSummary = longLines[0].trim();
        if (descSummary.length > 300) {
          descSummary = descSummary.substring(0, 300) + '...';
        }
      } else {
        descSummary = description.length > 300 ? description.substring(0, 300) + '...' : description;
      }
    }
    
    // 順位ごとに異なる導入文を追加
    if (rank === 1) {
      review += `[順位に応じた特徴的な導入文]\n`;
    } else if (rank === 2) {
      review += `[順位に応じた特徴的な導入文]\n`;
    }
    // ... 他の順位も同様に
    
    review += `「${title}」は、${maker}から発売された${actress !== '不明' ? actress + '主演の' : ''}${keyword}AV。${descSummary}という展開が描かれます。\n\n`;
  } else {
    // あらすじがない場合のフォールバック
    review += `「${title}」は、${maker}から発売された${actress !== '不明' ? actress + '主演の' : ''}${keyword}AV。`;
    if (titleKeyword) {
      review += `${keyword}×${titleKeyword}という要素が組み合わさった作品として話題を集めています。\n\n`;
    } else {
      review += `${keyword}という肌色の魅力と、健康的な美しさがエロティシズムと融合した作品です。\n\n`;
    }
  }
  
  // 2. 最大の見どころ（レビューから具体的なシーンを抽出・筆者の個人的な感想を交えた形式）
  // **重要**: ステップ6.6の「本作の最大の見どころ」の生成方法に従って実装すること
  // - レビューから具体的なシーンを抽出
  // - 筆者の個人的な感想を交えた形式で書く
  // - 順位ごとに異なる表現を使用
  
  const reviews = fanzaInfo?.reviews || [];
  const reviewText = extractSceneFromReview(reviews, title);
  const sceneDescription = extractSceneDescription(reviewText);
  
  review += `本作の最大の見どころは、`;
  
  // レビューから具体的なシーンを抽出して使用
  if (sceneDescription) {
    review += `${sceneDescription}。`;
  } else if (reviewText) {
    // レビューから具体的なシーンを抽出
    const extractedScene = extractSceneFromReview(reviews, title);
    if (extractedScene) {
      review += `${extractedScene}。`;
    } else {
      // フォールバック: タイトルやあらすじから特徴を抽出
      review += `[タイトルやあらすじから抽出した特徴的な展開]。`;
    }
  } else {
    // フォールバック: タイトルやあらすじから特徴を抽出
    review += `[タイトルやあらすじから抽出した特徴的な展開]。`;
  }
  
  // 筆者の個人的な感想を交えた形式で締めくくる
  const emotionExpressions = [
    'このエロティックな展開には筆者もムラムラが止まりませんでした！',
    'この過激な展開には筆者も興奮が止まりませんでした！',
    'この総集編の豪華さには筆者も驚きを隠せませんでした！',
    'この下品エロには筆者もムラムラが止まりませんでした！',
    'この背徳的な展開には筆者も興奮が止まりませんでした！',
    'この生々しい展開には筆者もムラムラが止まりませんでした！',
    'この過激な展開には筆者も興奮が止まりませんでした！',
    'このリアルなシチュエーションには筆者もムラムラが止まりませんでした！',
    'この温泉旅行でのヤリまくりには筆者も興奮が止まりませんでした！',
    'このリアルな展開には筆者もムラムラが止まりませんでした！'
  ];
  const emotionIndex = (rank - 1) % emotionExpressions.length;
  review += ` ${emotionExpressions[emotionIndex]}\n\n`;
  
  // 3. 収録時間と要素の組み合わせ
  if (volume) {
    review += `収録時間は${volume}分とたっぷりで、`;
  }
  
  // キーワードの組み合わせを生成（重複を避ける）
  if (titleKeyword) {
    review += `${keyword}×${titleKeyword}`;
  } else {
    review += `${keyword}`;
  }
  review += `という要素が組み合わさった本作は、${keyword}AVファンなら必見の一本。`;
  
  // 4. おすすめできる人
  review += `${actress !== '不明' ? actress + 'の' : ''}${keyword}作品を探している方、`;
  if (titleKeyword) {
    review += `${titleKeyword}シチュエーションが好きな方、`;
  }
  review += `${keyword}AVを好む方すべてにおすすめできる作品です。`;
  
  return review;
}
```

7. **FANZA情報取得の実装例（再試行機能付き）**
```javascript
// FANZA情報を取得する関数（改良版・再試行機能付き）
async function fetchFanzaContent(affiliateURL) {
  const urlObj = new URL(affiliateURL);
  const lurl = urlObj.searchParams.get('lurl');
  if (!lurl) {
    console.error('FANZA URLの抽出に失敗しました');
    return null;
  }
  
  const fanzaUrl = decodeURIComponent(lurl);
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    await page.goto(fanzaUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // 年齢確認ページの処理
    // ... (年齢確認処理)
    
    // ページをスクロールして動的コンテンツの読み込みを待つ
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // 紹介文（あらすじ）を取得（再試行機能付き）
    let description = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        console.log(`紹介文取得の再試行 ${attempt + 1}回目...`);
        await page.waitForTimeout(2000);
        await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(3000);
      }
      
      description = await page.evaluate(() => {
        // 段階1: 主要なセレクターを試す
        const primarySelectors = [
          '.tx-hangaku', '.tx-detail', '.detail-txt',
          '.product-description', '[class*="description"]', '[id*="description"]'
        ];
        
        for (const selector of primarySelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              const text = element.innerText || element.textContent;
              if (text && text.length > 100 && text.length < 5000) {
                const excludeKeywords = ['キャンペーン', 'ポイント', 'プレゼント', 'ログイン', '会員登録'];
                if (!excludeKeywords.some(keyword => text.includes(keyword))) {
                  return text.trim();
                }
              }
            }
          } catch (e) {}
        }
        
        // 段階2: ページ全体から長いテキストを探す
        const allElements = document.querySelectorAll('div, p, section, article');
        const candidates = [];
        
        for (const element of allElements) {
          const text = element.innerText || element.textContent;
          if (text && text.length > 200 && text.length < 3000) {
            const excludeKeywords = ['キャンペーン', 'ポイント', 'ログイン', '会員登録', 'すべて', '動画'];
            const includeKeywords = ['結婚', '夫', '妻', '温泉', '旅行', '相部屋', '中出し', '犯', '痴女'];
            
            if (!excludeKeywords.some(k => text.includes(k)) && 
                includeKeywords.some(k => text.includes(k))) {
              candidates.push({ text: text.trim(), length: text.length });
            }
          }
        }
        
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.length - a.length);
          return candidates[0].text;
        }
        
        return null;
      });
      
      if (description && description.length > 100) {
        console.log(`紹介文を取得しました（${attempt + 1}回目）`);
        break;
      }
    }
    
    // レビューを取得（再試行機能付き）
    let reviews = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        console.log(`レビュー取得の再試行 ${attempt + 1}回目...`);
        await page.waitForTimeout(2000);
      }
      
      const attemptReviews = await page.evaluate(() => {
        const reviewElements = [];
        const seenTexts = new Set();
        
        // 段階1: 主要なレビューセレクターを試す
        const reviewSelectors = [
          '.d-review__item', '.d-review__text', '.review-item',
          '[class*="review"]', '[id*="review"]'
        ];
        
        for (const selector of reviewSelectors) {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              const text = el.innerText || el.textContent;
              if (text && text.length > 50 && text.length < 1000) {
                const trimmed = text.trim();
                if (seenTexts.has(trimmed)) return;
                
                const reviewKeywords = ['良い', '最高', 'おすすめ', '満足', '評価', '星'];
                const excludeKeywords = ['キャンペーン', 'ポイント', 'ログイン', '会員登録'];
                
                if (reviewKeywords.some(k => trimmed.includes(k)) &&
                    !excludeKeywords.some(k => trimmed.includes(k))) {
                  reviewElements.push(trimmed);
                  seenTexts.add(trimmed);
                }
              }
            });
            if (reviewElements.length > 0) break;
          } catch (e) {}
        }
        
        // 段階2: ページ全体からレビューらしいテキストを探す
        if (reviewElements.length === 0) {
          const allText = document.body.innerText || '';
          const lines = allText.split('\n').filter(line => {
            const trimmed = line.trim();
            if (trimmed.length < 30 || trimmed.length > 500) return false;
            if (seenTexts.has(trimmed)) return false;
            
            const reviewKeywords = ['良い', '最高', 'おすすめ', '満足', '評価'];
            const excludePatterns = ['ログイン', '会員登録', '購入', 'カート', 'すべて', '動画'];
            
            return reviewKeywords.some(k => trimmed.includes(k)) &&
                   !excludePatterns.some(p => trimmed.includes(p));
          });
          reviewElements.push(...lines.slice(0, 10));
        }
        
        return reviewElements.slice(0, 10);
      });
      
      if (attemptReviews && attemptReviews.length > 0) {
        reviews = attemptReviews;
        console.log(`レビューを${reviews.length}件取得しました（${attempt + 1}回目）`);
        break;
      }
    }
    
    return { url: fanzaUrl, description, reviews, volume: null };
  } finally {
    await browser.close();
  }
}
```

8. **記事ファイルへの反映**
   - 生成したレビューを記事ファイルの各順位の「おすすめポイント」セクションに反映
   - `ohsawa/update-{keyword}-reviews-with-description.js`のようなスクリプトを使用して記事ファイルを更新
   - **重要**: パターンマッチングは`contentId`ベースで行う（順位の表記が異なる場合でも確実にマッチする）
   - 更新順序: 10位から1位の順で処理して、重複を避ける

**記事ファイル更新の実装例:**
```javascript
// 記事ファイルを更新する関数
function updateArticleWithReviews(articlePath, reviews, rankingItems) {
  let articleContent = fs.readFileSync(articlePath, 'utf-8');
  
  // 順位順に処理（10位から1位の順で処理して、重複を避ける）
  for (let i = rankingItems.length - 1; i >= 0; i--) {
    const item = rankingItems[i];
    const review = reviews[item.contentId];
    if (review) {
      // パターン: #### おすすめポイント\n...\n\n[スワイプで動画を観る]まで
      // contentIdで特定のセクションをマッチング
      const pattern = new RegExp(
        `(#### おすすめポイント\\n)([^]*?)(\n\\[スワイプで動画を観る\\][^]*?content/${item.contentId})`,
        's'
      );
      
      const match = articleContent.match(pattern);
      if (match) {
        const replacement = `$1${review}\n\n$3`;
        articleContent = articleContent.replace(pattern, replacement);
        console.log(`${item.rank}位のレビューを更新しました`);
      } else {
        console.log(`${item.rank}位のレビューが見つかりませんでした（contentId: ${item.contentId}）`);
      }
    }
  }
  
  // 記事ファイルを保存
  fs.writeFileSync(articlePath, articleContent, 'utf-8');
  console.log(`記事ファイルを更新しました: ${articlePath}`);
}
```

### ステップ6.6: 「本作の最大の見どころ」の生成（レビューから具体的なシーンを抽出・筆者の個人的な感想を交えた形式）

**重要**: すべてのランキング項目（1位〜10位）について、「本作の最大の見どころ」をレビューから具体的なシーンを抽出し、筆者の個人的な感想を交えた形式で生成する。この方法は、AV名作ランキング（作品）とAV女優ランキング（人物）の両方のタイプの記事で実行できる。

#### 1. レビューから具体的なシーンを抽出する方法

**必須**: FANZAから取得したユーザーレビューを分析し、以下の要素を抽出する：

1. **具体的な動作やシーンの描写**
   - レビュー内の具体的な動作（例：「寄り目アへ顔を披露しながら」「ジョボジョボと失禁する」「大量の潮が顔にかかる」）
   - シーンの場所や状況（例：「サウナの中での絡み」「オフィスで人が見ている中での3P」「人がいっぱいいるフロアでの生着替え」）
   - 特徴的な反応や表情（例：「苦笑いで返すリアクション」「手で身体を一生懸命隠している」）

2. **レビューからシーンを抽出する関数の実装例**
```javascript
// レビューから具体的なシーンを抽出する関数
function extractSceneFromReview(reviews, title) {
  if (!reviews || reviews.length === 0) return null;
  
  // レビューを結合して分析
  const allReviews = reviews.join(' ');
  
  // 具体的なシーンを描写しているキーワードを探す
  const sceneKeywords = [
    'シーン', 'チャプター', '絡み', '失禁', '潮吹き', '汗だく', 
    '寄り目', 'アへ顔', '苦笑い', 'リアクション', '生着替え',
    '3P', '4P', '大量の潮', 'べちょべちょ', 'イカされる'
  ];
  
  // レビューから具体的なシーンを抽出
  for (const review of reviews) {
    // 長いレビュー（100文字以上）を優先
    if (review.length > 100) {
      // 具体的な動作やシーンを描写している部分を探す
      for (const keyword of sceneKeywords) {
        if (review.includes(keyword)) {
          // キーワードの前後50文字を抽出
          const index = review.indexOf(keyword);
          const start = Math.max(0, index - 50);
          const end = Math.min(review.length, index + 100);
          const scene = review.substring(start, end).trim();
          
          // 具体的なシーンを描写している部分を返す
          if (scene.length > 30 && scene.length < 200) {
            return scene;
          }
        }
      }
    }
  }
  
  return null;
}

// レビューからシーンの説明を抽出する関数（より詳細版）
function extractSceneDescription(reviewText) {
  if (!reviewText) return null;
  
  // 具体的な動作やシーンを描写している部分を探す
  const scenePatterns = [
    /(.*?寄り目.*?失禁.*?シーン)/,
    /(.*?大量の潮.*?顔.*?シーン)/,
    /(.*?汗だく.*?べちょべちょ.*?イカされる)/,
    /(.*?生着替え.*?手で身体.*?隠している)/,
    /(.*?苦笑い.*?リアクション.*?エロい)/
  ];
  
  for (const pattern of scenePatterns) {
    const match = reviewText.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // フォールバック: レビューの最初の100文字からシーンを抽出
  if (reviewText.length > 100) {
    const excerpt = reviewText.substring(0, 150);
    // 具体的な動作やシーンを描写している部分を探す
    if (excerpt.includes('シーン') || excerpt.includes('チャプター') || excerpt.includes('絡み')) {
      return excerpt.split('。')[0] + 'シーン';
    }
  }
  
  return null;
}
```

#### 2. 筆者の個人的な感想を交えた形式で書く方法

**必須**: 「本作の最大の見どころ」は、以下の形式で生成する：

1. **基本構造（「本作の最大の見どころは」というワードは使わない）**
   - 「[具体的なシーンや臨場感のある描写]。この[形容詞]には筆者も[感情表現]が止まりませんでした！」
   - 例：「会社で一番目立たないアラサー喪女、離婚したばかりのところにつけこみ食べにいくところの臨場感とだんだん心と股を開いていくエロさに勃起が止まりませんでした！」
   - 例：「小柄な敏感BODYをデカチン達が襲いまくるシーン。満足度200％の巨チンに理性を失い、汗だく汁まみれになりながらジブン史上最高の激イキを繰り返す展開には筆者も興奮が止まりませんでした！」

2. **避けるべき定型文**
   - ❌ 「本作の最大の見どころは、[設定]という[背景]が、エロティシズムと相まって、濃厚な作品として評価されています」
   - ❌ 「[設定]という[背景]が、エロティシズムと相まって」
   - ❌ 「設定」「背景」というワード
   - ✅ 「[具体的なシーンや臨場感のある描写]。この[形容詞]には筆者も[感情表現]が止まりませんでした！」

2. **筆者の個人的な感想を交える表現パターン**
   - 「筆者もムラムラが止まりませんでした！」
   - 「筆者も興奮が止まりませんでした！」
   - 「筆者も驚きを隠せませんでした！」
   - 「筆者も興奮が止まりませんでした！」

3. **順位ごとに異なる表現を使用**
   - 1位：「このエロティックな展開には筆者もムラムラが止まりませんでした！」
   - 2位：「この過激な展開には筆者も興奮が止まりませんでした！」
   - 3位：「この総集編の豪華さには筆者も驚きを隠せませんでした！」
   - 4位：「この下品エロには筆者もムラムラが止まりませんでした！」
   - 5位：「この背徳的な展開には筆者も興奮が止まりませんでした！」
   - 6位：「この生々しい展開には筆者もムラムラが止まりませんでした！」
   - 7位：「この過激な展開には筆者も興奮が止まりませんでした！」
   - 8位：「このリアルなシチュエーションには筆者もムラムラが止まりませんでした！」
   - 9位：「この温泉旅行でのヤリまくりには筆者も興奮が止まりませんでした！」
   - 10位：「このリアルな展開には筆者もムラムラが止まりませんでした！」

#### 3. 「本作の最大の見どころ」を生成する関数の実装例

```javascript
// note.com風の面白い「本作の最大の見どころ」を生成
function generateTokoroWithReview(item, fanzaInfo, rank) {
  const { title } = item;
  const reviews = fanzaInfo?.reviews || [];
  
  // レビューから具体的なシーンを抽出
  const reviewText = extractSceneFromReview(reviews, title);
  const sceneDescription = extractSceneDescription(reviewText);
  
  let tokoro = '本作の最大の見どころは、';
  
  // 順位ごとに異なる内容を生成
  if (rank === 1) {
    if (sceneDescription) {
      tokoro += `${sceneDescription}。`;
    } else {
      // フォールバック: タイトルから特徴を抽出
      tokoro += `[タイトルから抽出した特徴的な展開]。`;
    }
    tokoro += ` このエロティックな展開には筆者もムラムラが止まりませんでした！`;
  } else if (rank === 2) {
    if (sceneDescription) {
      tokoro += `${sceneDescription}。`;
    } else if (reviewText && reviewText.includes('[特定のキーワード]')) {
      tokoro += `[レビューから抽出した具体的なシーン]。`;
    } else {
      tokoro += `[タイトルから抽出した特徴的な展開]。`;
    }
    tokoro += ` この過激な展開には筆者も興奮が止まりませんでした！`;
  } else if (rank === 3) {
    // 総集編などの場合はボリュームを強調
    if (title.includes('総集編') || title.includes('スペシャル')) {
      tokoro += `[ボリューム感を強調した表現]。`;
    } else if (sceneDescription) {
      tokoro += `${sceneDescription}。`;
    } else {
      tokoro += `[タイトルから抽出した特徴的な展開]。`;
    }
    tokoro += ` この総集編の豪華さには筆者も驚きを隠せませんでした！`;
  } else {
    // 4位以降も同様に、レビューから具体的なシーンを抽出
    if (sceneDescription) {
      tokoro += `${sceneDescription}。`;
    } else if (reviewText) {
      // レビューから具体的なシーンを抽出
      const extractedScene = extractSceneFromReview(reviews, title);
      if (extractedScene) {
        tokoro += `${extractedScene}。`;
      } else {
        tokoro += `[タイトルから抽出した特徴的な展開]。`;
      }
    } else {
      tokoro += `[タイトルから抽出した特徴的な展開]。`;
    }
    
    // 順位に応じた感情表現を追加
    const emotionExpressions = [
      'この下品エロには筆者もムラムラが止まりませんでした！',
      'この背徳的な展開には筆者も興奮が止まりませんでした！',
      'この生々しい展開には筆者もムラムラが止まりませんでした！',
      'この過激な展開には筆者も興奮が止まりませんでした！',
      'このリアルなシチュエーションには筆者もムラムラが止まりませんでした！',
      'この温泉旅行でのヤリまくりには筆者も興奮が止まりませんでした！',
      'このリアルな展開には筆者もムラムラが止まりませんでした！'
    ];
    const emotionIndex = (rank - 4) % emotionExpressions.length;
    tokoro += ` ${emotionExpressions[emotionIndex]}`;
  }
  
  return tokoro;
}
```

#### 4. すべてのタイプの記事で実行する方法

**重要**: この方法は、以下のすべてのタイプの記事で実行できる：

1. **AV名作ランキング（作品）**
   - 各作品のFANZAレビューから具体的なシーンを抽出
   - 作品のタイトルやあらすじから特徴的な展開を抽出
   - 筆者の個人的な感想を交えた形式で「本作の最大の見どころ」を生成

2. **AV女優ランキング（人物）**
   - 各女優の出演作品のFANZAレビューから具体的なシーンを抽出
   - 女優の特徴的な演技や反応を抽出
   - 筆者の個人的な感想を交えた形式で「本作の最大の見どころ」を生成

#### 5. 記事への反映方法

**必須**: 生成した「本作の最大の見どころ」を記事の「おすすめポイント」セクション内に反映する：

```javascript
// 記事の「おすすめポイント」セクションを更新
function updateArticleContent(articleContent, item, recommendation, baseScore, starRating) {
  const contentId = item.content_id || '';
  const escapedContentId = contentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // 「本作の最大の見どころは、」の部分を更新
  const pattern = new RegExp(
    `(本作の最大の見どころは、)([^]*?)(\\n\\n矢埜愛茉の作品を探している方[^]*?${escapedContentId})`,
    's'
  );
  
  const match = articleContent.match(pattern);
  if (match) {
    const newTokoro = generateTokoroWithReview(item, fanzaInfo, item.rank);
    const replacement = `$1${newTokoro}$3`;
    articleContent = articleContent.replace(pattern, replacement);
    console.log(`${item.rank}位の「本作の最大の見どころ」を更新しました`);
  }
  
  return articleContent;
}
```

#### 6. 実装時の注意事項

1. **レビューが取得できない場合のフォールバック**
   - レビューが取得できない場合は、タイトルやあらすじから特徴的な展開を抽出
   - フォールバックでも、筆者の個人的な感想を交えた形式を維持

2. **重複を避ける**
   - 各順位ごとに異なる具体的なシーンを抽出
   - 同じシーンの説明が複数の順位で使用されないようにする

3. **SEO最適化**
   - キーワード（女優名、ジャンル、シチュエーションなど）を自然に配置
   - 具体的なシーンの描写により、検索エンジンでの評価を向上

4. **読みやすさの確保**
   - 長すぎる説明は避け、簡潔で面白い文章にする
   - note.com風の読みやすい文章を心がける

### ステップ7: 記事生成スクリプトの作成/実行

**重要**: 記事生成スクリプトは`ohsawa`フォルダ内に作成し、生成されるファイルもすべて`ohsawa`フォルダ内に保存してください。

#### スクリプト名
- `ohsawa/generate-{keyword}-article.js`（例：`ohsawa/generate-joshishi-article.js`）

#### スクリプト構造（ES Module対応）
```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 許可メーカーリスト
const includeOnlyMakers = [/* 上記リスト */];

// 2. JSONファイルを読み込む（BOM削除対応）
// 注意: スクリプトはohsawaフォルダ内に配置するため、相対パスで読み込む
const responsePath = path.join(__dirname, 'response-{keyword}-{genre_id}.json');
const jsonContent = fs.readFileSync(responsePath, 'utf-8');
const cleanContent = jsonContent.replace(/^\uFEFF/, ''); // BOM削除
const responseData = JSON.parse(cleanContent);

// 3. アイテムを取得
let items = responseData.result?.items || [];

// 4. VR作品を除外
items = items.filter(item => {
  const genres = item.iteminfo?.genre || [];
  const hasVR = genres.some(g => 
    g.name && (g.name.includes('VR') || g.name.includes('vr') || 
               g.name === 'VR専用' || g.name === 'ハイクオリティVR' || 
               g.name === '8KVR')
  );
  const titleHasVR = item.title && 
    (item.title.includes('VR') || item.title.includes('vr') || 
     item.title.includes('【VR】'));
  return !hasVR && !titleHasVR;
});

// 5. メーカーフィルタリング（柔軟なマッチング）
items = items.filter(item => {
  const makerName = item.iteminfo?.maker?.[0]?.name || item.maker?.name || '';
  return includeOnlyMakers.some(included => {
    // 完全一致、部分一致、カタカナ/英語変換対応
    const normalizedMaker = makerName.trim();
    const normalizedIncluded = included.trim();
    if (normalizedMaker === normalizedIncluded) return true;
    if (normalizedMaker.includes(normalizedIncluded) || 
        normalizedIncluded.includes(normalizedMaker)) return true;
    if ((included === 'Madonna' || included === 'マドンナ') && 
        (makerName === 'マドンナ' || makerName === 'Madonna')) return true;
    return false;
  });
});

// 6. 必須フィールドの検証
const validItems = items.filter(item => {
  return item.title && 
         item.content_id && 
         (item.affiliateURL || item.URL) && 
         (item.iteminfo?.maker?.[0]?.name || item.maker?.name);
});

// 7. ランキング用に10件に絞る
const rankingItems = validItems.slice(0, 10);

// 8. 画像URLを取得する関数
function getImageUrls(item) {
  const urls = [];
  if (item.sampleImageURL?.sample_l?.image) {
    urls.push(...item.sampleImageURL.sample_l.image.slice(0, 3));
  } else if (item.sampleImageURL?.sample_s?.image) {
    urls.push(...item.sampleImageURL.sample_s.image.slice(0, 3));
  } else if (item.imageURL?.large) {
    urls.push(item.imageURL.large);
  }
  return urls;
}

// 9. 女優情報を取得する関数（Promise版）
function fetchActressInfo(actressId) {
  return new Promise((resolve, reject) => {
    const apiId = 'tmuYYhApYPz2LaGknMun';
    const affiliateId = 'masaeng-990';
    const apiUrl = `https://api.dmm.com/affiliate/v3/ActressSearch?api_id=${apiId}&affiliate_id=${affiliateId}&actress_id=${actressId}&output=json`;
    
    https.get(apiUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.result?.actress?.[0] || null);
        } catch (error) {
          console.error(`Actress API parse error for ${actressId}:`, error);
          resolve(null);
        }
      });
    }).on('error', (error) => {
      console.error(`Actress API error for ${actressId}:`, error);
      resolve(null);
    });
  });
}

// 9.5. FANZA情報を取得する関数（Playwright使用・必須）
// 注意: この関数はPlaywrightを使用するため、事前にインストールが必要
// npm install playwright
// npx playwright install chromium
async function fetchFanzaContent(affiliateURL) {
  // 実装は fetch-fanza-content.js を参照
  // アフィリエイトURLから実際のFANZA URLを抽出し、Playwrightでアクセス
  // 年齢確認を突破し、紹介文と収録時間を取得
  // 戻り値: { url, description, recordingTime, favoriteCount }
  // 注意: favoriteCountは使用しない（お気に入り登録数は記載しない）
  
  // 実装例（簡易版）:
  // const { chromium } = require('playwright');
  // const browser = await chromium.launch({ headless: false });
  // ... (詳細は fetch-fanza-content.js を参照)
  
  // ここでは簡易実装として、nullを返す（実際の実装では上記の処理を実行）
  return null;
}

// 10. 女優紹介文を生成する関数（FANZA情報を基に生成）
function generateActressIntro(fanzaInfo, actress, keyword, ranking) {
  const name = actress?.name || '女優名不明';
  
  // **重要**: 定型のプロフィール情報（身長、スリーサイズ、おっぱいのハリ、肌、フェチ度など）は使用しない
  // FANZAから取得した紹介文を基に、作品の内容や特徴、女優の演技に基づく自然なコメントを生成
  
  if (!fanzaInfo || !fanzaInfo.description) {
    // FANZA情報がない場合は、作品の特徴を簡潔に述べる
    return `${name}の${keyword}作品として、高い評価を受けています。`;
  }
  
  // FANZA情報から作品の特徴を抽出して自然なコメントを生成
  const desc = fanzaInfo.description;
  
  // 作品の特徴を抽出
  const features = [];
  if (desc.includes('相部屋')) features.push('相部屋');
  if (desc.includes('痴女')) features.push('痴女');
  if (desc.includes('汗だく') || desc.includes('汗')) features.push('汗だく');
  if (desc.includes('中出し')) features.push('中出し');
  if (desc.includes('淫語')) features.push('淫語');
  if (desc.includes('不倫')) features.push('不倫');
  if (desc.includes('エステ')) features.push('エステ');
  if (desc.includes('SM')) features.push('SM');
  
  // セリフを抽出（「」で囲まれた部分）
  const quotes = desc.match(/「([^」]+)」/g) || [];
  const quotesText = quotes.slice(0, 2).join('、');
  
  // おすすめポイントを生成（作品の内容や特徴に基づく）
  let intro = '';
  
  if (quotesText) {
    intro += `本作の特徴的なセリフとして、${quotesText}などが印象的。`;
  }
  
  if (features.length > 0) {
    intro += `${name}の${features.join('×')}という要素が組み合わさった本作は、${keyword}AVとして高い評価を受けています。`;
  } else {
    intro += `${name}の${keyword}作品として、高い評価を受けています。`;
  }
  
  if (fanzaInfo.recordingTime) {
    intro += `収録時間${fanzaInfo.recordingTime}分とたっぷりで、`;
  }
  
  intro += `${keyword}AVファンなら必見の一本です。`;
  
  return intro;
}

// まとめテキストを生成する関数
function getSummaryText(keyword) {
  // キーワードに応じたまとめテキストを返す
  const summaryMap = {
    '女上司': '相部屋、エステ、SM、不倫など様々なシチュエーションで展開される女上司AVの魅力を、ランキング形式でご紹介しました。上品でかつエッチでビッチな女上司の包容力と、職場という背徳感あふれるシチュエーションが組み合わさった作品は、他のジャンルでは味わえない特別な魅力があります。',
    'ぽっちゃり': 'むっちりとした柔らかいボディの魅力を、ランキング形式でご紹介しました。',
    '巨尻': '豊満な尻の魅力を、ランキング形式でご紹介しました。',
    'めがね': 'めがねフェチの魅力を、ランキング形式でご紹介しました。'
  };
  
  return summaryMap[keyword] || `${keyword}AVの魅力を、ランキング形式でご紹介しました。`;
}

// 10.6. おすすめポイントを生成する関数（FANZA情報を基に、女優情報なしの場合用）
function generateRecommendationPoint(fanzaInfo, title, actressName, keyword) {
  if (!fanzaInfo || !fanzaInfo.description) {
    return `${title}は、${keyword}AVとして高い評価を受けている作品です。`;
  }
  
  const desc = fanzaInfo.description;
  
  // 作品の特徴を抽出
  const features = [];
  if (desc.includes('相部屋')) features.push('相部屋');
  if (desc.includes('痴女')) features.push('痴女');
  if (desc.includes('汗だく') || desc.includes('汗')) features.push('汗だく');
  if (desc.includes('中出し')) features.push('中出し');
  if (desc.includes('淫語')) features.push('淫語');
  if (desc.includes('不倫')) features.push('不倫');
  if (desc.includes('エステ')) features.push('エステ');
  if (desc.includes('SM')) features.push('SM');
  if (desc.includes('タイトスカート')) features.push('タイトスカート');
  
  // セリフを抽出（「」で囲まれた部分）
  const quotes = desc.match(/「([^」]+)」/g) || [];
  const quotesText = quotes.slice(0, 2).join('、');
  
  // おすすめポイントを生成
  let point = `${title}は、${keyword}AVとして高い評価を受けている作品です。\n\n`;
  
  if (quotesText) {
    point += `本作の特徴的なセリフとして、${quotesText}などが印象的。`;
  }
  
  if (features.length > 0) {
    point += `${features.join('×')}という要素が組み合わさった本作は、`;
  } else {
    point += `本作は、`;
  }
  
  if (actressName) {
    point += `${actressName}の${keyword}作品を探している方、`;
  }
  
  if (fanzaInfo.recordingTime) {
    point += `収録時間${fanzaInfo.recordingTime}分とたっぷりで、`;
  }
  
  point += `${keyword}AVファンなら必見の一本です。`;
  
  return point;
}

// 11. 記事生成関数（非同期）
async function generateArticle() {
  const keyword = '{keyword}';
  const rankingType = '{A or B}';
  
  // キーワードに応じた歴史
  function getKeywordHistory(keyword) {
    const historyMap = {
      '女上司': '平成序盤の職場ものから、令和の密着系女上司',
      'ギャル': 'アムラー全盛期の小麦肌から、最近のナチュラルめ黒ギャル',
      '黒ギャル': 'アムラー全盛期の小麦肌から、最近のナチュラルめ黒ギャル',
      'ぽっちゃり': '平成のむちむち系から令和のナチュラルぽちゃ'
    };
    return historyMap[keyword] || `平成序盤から令和の${keyword}`;
  }
  
  // 記事本文生成（以下参照）
  // ...
  
  return articleContent;
}

// 12. 記事を生成（非同期関数なのでawaitが必要）
(async () => {
  const article = await generateArticle();
  
  // 記事を.jsファイルとして保存
  const keyword = '{keyword}';
  const articleSlug = '{keyword-sanitized}-av-ranking-2025';
  const seoTitle = `${keyword}AVおすすめランキング【2025年最新版】${keyword}を探すならhentaitok`;
  
  // 最初のランキング項目の画像を取得（featuredImage用）
  const firstItemImage = rankingItems[0] ? getImageUrls(rankingItems[0])[0] : '';
  
  const articleJsContent = `export default {
    id: "${articleSlug}",
    title: "${seoTitle}",
    slug: "${articleSlug}",
    description: "${keyword}の中でも2025年にチェックしておきたい作品・出演者を、DMM/FANZAのデータをもとに、hentai-tokのライターエモリが厳選した作品をご紹介。肉感・密着感・出演本数で評価し、スワイプで視聴できる導線も掲載しています。",
    content: \`${article.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`,
    author: "エモリ（hentaitok編集部）／AVレビュー編集長",
    publishedAt: "${new Date().toISOString()}",
    updatedAt: "${new Date().toISOString()}",
    tags: [
      "${keyword}",
      "AV",
      "ランキング",
      "おすすめ",
      "2025年",
      "最新"
    ],
    category: "AVランキング",
    featuredImage: "${firstItemImage}",
    
    // 関連画像
    images: [
      {
        url: "${firstItemImage}",
        alt: "${keyword}AV女優のサムネイル",
        caption: "2025年最新の${keyword}AV作品"
      }
    ],
    seo: {
      title: "${seoTitle}｜hentaitok",
      description: "${keyword}の中でも2025年にチェックしておきたい作品・出演者を、DMM/FANZAのデータをもとに、hentai-tokのライターエモリが厳選した作品をご紹介。肉感・密着感・出演本数で評価し、スワイプで視聴できる導線も掲載しています。",
      keywords: [
        "${keyword}AV",
        "おすすめランキング",
        "2025年",
        "最新",
        "FANZA",
        "DMM"
      ]
    },
    published: true,
    featured: true
  }`;
  
  // 注意: 生成ファイルはohsawaフォルダから見た相対パスで、親ディレクトリのassets/articlesに保存
  // スクリプトがohsawaフォルダ内にある場合、親ディレクトリに移動する必要がある
  const outputPath = path.join(__dirname, '..', 'assets', 'articles', `${articleSlug}.js`);
  fs.writeFileSync(outputPath, articleJsContent, 'utf-8');
  
  console.log(`記事を生成しました: ${outputPath}`);
  console.log(`ランキング件数: ${rankingItems.length}件`);
})();
```

### ステップ8: 記事本文生成テンプレート（SEO最適化版・マークダウン形式）

**重要**: 記事本文は必ずマークダウン形式で生成する。以下のフォーマットを厳守すること。

```javascript
// ジャンルIDを取得（ステップ1で取得したgenreIdを使用）
// allTags.jsonから取得したgenreIdを変数genreIdに格納しておくこと

let articleContent = `# ${keyword}AVおすすめランキング【2025年最新版】

## ${keyword}AV探すならhentaitok！

**${keyword}AVを探しているあなたへ。**hentaitokは、「1スワイプでAVに出会える」新感覚のAVサイトです。Tiktokのような直感的な操作感で、あなたの効率的な${keyword}AV探しをサポートします。

${keyword}の魅力を堪能できる作品が揃う${keyword}AV。hentaitokなら、スワイプするだけでお気に入りの${keyword}AV作品に出会えます。

**${keyword}AVをここからスワイプで探せます！**

[スワイプで${keyword}AVの動画を観る](https://hentai-tok.com/video/genre/${genreId})

**重要**: hentaitok紹介セクションのSEO最適化ポイント
- キーワード（${keyword}）を自然に3回以上含める（見出し、本文、リンクテキスト）
- 具体的な魅力を簡潔に説明する（例：「短いスカートから覗く美脚や、スカートをめくる瞬間のエロティシズムが魅力のミニスカAV」）
- ユーザーの行動を促すCTA（Call to Action）を含める（例：「**${keyword}AVをここからスワイプで探せます！**」）
- 適切なリンクを含める（ジャンルIDはステップ1で取得したgenreIdを使用）
- 見出しは「## ${keyword}AV探すならhentaitok！」形式で統一

${keyword}と朝までハメるッ！${keyword}AV女優でシコれば、意識がトブほど気持ちいい射精ができちゃいます。

本記事にアクセスしたアナタも、激シコ${keyword}動画で今すぐチンポぶっこきたい気分なのでは？

${keyword}AV女優といえば、様々なシチュエーションが楽しめるジャンルです。

伝統的な美しさとエロティシズムが融合した${keyword}の魅力は、上品でかつエッチでビッチな包容力。相部屋でのNTR展開や、温泉での中出しSEX、アナルプレイまで、男の変態チックな願望もすべて受け入れてくれる…あの独特の包容力がいいんですよね。

そんなわけで今回は、今最強にヌケるおすすめ${keyword}AVを徹底特集。

エロ画像大量の即ヌキ仕様でお届けいたしますので、${keyword}スキーの方はぜひチェックしてみてください！

## ライターエモリがエロい「${keyword}」のおすすめAVを厳選！

みなさんこんにちは、hentaitok編集部のエモリ（hentaitok編集部）／AVレビュー編集長です。${getKeywordHistory(keyword)}をひたすら追い続けています。

本記事では、旅先での密着セックスから披露宴での背徳感あふれるNTR、花火大会での幼馴染との相部屋、イメビ撮影から生ハメ撮影への展開まで、様々なタイプの${keyword}AVをご紹介。

${keyword}の魅力はズバリ、伝統的な衣装が作り出す特別なシチュエーションでのエロス。密着セックス、相部屋でのNTR、披露宴での背徳感、花火大会での青春感、アナルプレイまで、様々な要素が組み合わさった作品が楽しめます。

今回はそんな${keyword}AVの中から、特にシコリティの高いおすすめAVをランキング形式でご紹介。

${keyword}ジャンキーの筆者が本気で厳選した「史上最強の${keyword}AV集」です。サンプル画像もたっぷりご用意しておりますので、記事読みながらシコちゃってもOKですよ！

**重要**: 記事の冒頭部分は、おすすめポイントの内容（各順位の作品の特徴、シチュエーション、セリフなど）を基にリライトすること。具体的な作品の特徴を冒頭に組み込むことで、より魅力的な記事になる。

## ${keyword}AVの評価基準

### ◆①フェチズム◆
・${keyword}という立場の魅力、制服やスーツなどの衣装、職場というシチュエーションのエロさを評価する項目です。上下関係の逆転や背徳感、密室での密着プレイなど、${keyword}AVならではの要素がしっかりと描かれているかがポイントです。

### ◆②ルックス・雰囲気◆
・顔立ち・笑顔・仕草・清潔感を中心に、作品ごとのキャラ作りや衣装・メイク適性まで総合評価します。「抱き寄せたくなる」空気を出せる子、目線やポーズで色気をコントロールできる子は高評価。メイクが浮いている、所作が雑で色気が切れる、表情が単調など"冷めポイント"が目立つ場合は減点です。

### ◆③セックス・絡みの完成度◆
・シーン全体の高まりやテンポ、リードの巧さを評価する項目です。セックスのうまさや体重の預け方、覆いかぶさる距離感、カメラを意識した角度づくりで"抜き所"を量産できる子は高評価。相手任せで流れるだけ、反応や言葉が単調で熱が乗らない子は評価が伸びません。テクニック以上に"伝わる色気"を重視しています。

## 2025年最新｜${keyword}AVランキングTOP10
`;

// ランキング項目を追加（非同期で女優情報を取得）
for (let index = 0; index < rankingItems.length; index++) {
  const item = rankingItems[index];
  const rank = index + 1;
  const title = item.title || 'タイトル不明';
  const contentId = item.content_id || '';
  const affiliateURL = item.affiliateURL || item.URL || '';
  const maker = item.iteminfo?.maker?.[0]?.name || item.maker?.name || 'メーカー不明';
  const imageUrls = getImageUrls(item);
  
  // FANZA情報を取得（ステップ6.5で取得した情報を使用・必須）
  let fanzaInfo = null;
  if (affiliateURL) {
    console.log(`${rank}位のFANZA情報を取得中...`);
    fanzaInfo = await fetchFanzaContent(affiliateURL);
  }
  
  // 主な女優を取得（最初の1名）
  const mainActress = item.iteminfo?.actress?.[0];
  let actressInfo = null;
  let actressIntro = '';
  
  if (mainActress?.id) {
    console.log(`女優情報を取得中: ${mainActress.name} (ID: ${mainActress.id})`);
    actressInfo = await fetchActressInfo(mainActress.id);
    if (actressInfo && fanzaInfo) {
      // FANZA情報と女優情報の両方がある場合のみ、おすすめポイントを生成
      actressIntro = generateActressIntro(fanzaInfo, actressInfo, keyword, rank);
    }
  }
  
  // ランキング項目の構成（マークダウン形式・必須）：
  // 1. 順位とタイトル（### 1位 または ### 第2位：形式、引用情報を含む）
  // 2. 画像1（![サンプル画像1](url)形式）
  // 3. 登場AV女優名（女優情報がある場合、**太字**形式）
  // 4. 評価（リスト形式、女優情報がある場合）
  // 5. 画像2（![サンプル画像2](url)形式）
  // 6. おすすめポイント（#### おすすめポイント形式）
  // 7. リンク（スワイプで動画を観る、FANZAで購入する）
  
  // 順位の表示形式（1位は「1位」、2位以降は「第X位：」）
  const rankLabel = rank === 1 ? `${rank}位` : `第${rank}位：`;
  
  articleContent += `### ${rankLabel} ${title}（引用：FANZA／メーカー：${maker}）

![サンプル画像1](${imageUrls[0] || ''})

`;
  
  // 女優情報があれば追加
  if (actressInfo && mainActress) {
    articleContent += `**登場AV女優名：** ${mainActress.name}

**評価**
- ◆①フェチズム：★★★★★
- ◆②ルックス・雰囲気：★★★★★
- ◆③セックス・絡みの完成度：★★★★☆
- **総合：93点／100点**

`;
    
    // 2枚目の画像を配置（評価の後）
    if (imageUrls.length > 1) {
      articleContent += `![サンプル画像2](${imageUrls[1]})

`;
    }
    
    // おすすめポイントを追加（FANZA情報から生成した内容）
    // **重要**: ステップ6.6の「本作の最大の見どころ」の生成方法に従って実装すること
    // - レビューから具体的なシーンを抽出
    // - 筆者の個人的な感想を交えた形式で書く
    // - 順位ごとに異なる表現を使用
    
    // 「本作の最大の見どころ」を生成
    const tokoro = generateTokoroWithReview(item, fanzaInfo, rank);
    
    // おすすめポイントに「本作の最大の見どころ」を含める
    articleContent += `#### おすすめポイント
${actressIntro}

${tokoro}

`;
  } else {
    // 女優情報がない場合も2枚目の画像があれば配置
    if (imageUrls.length > 1) {
      articleContent += `![サンプル画像2](${imageUrls[1]})

`;
    }
    
    // おすすめポイントを追加（FANZA情報から生成した内容、女優情報なし版）
    articleContent += `#### おすすめポイント
${generateRecommendationPoint(fanzaInfo, title, null, keyword)}

`;
  }
  
  // リンクを追加
  articleContent += `[スワイプで動画を観る](https://hentai-tok.com/video/content/${contentId})
[FANZAで購入する](${affiliateURL})

`;
}

// 作品が10件に満たない場合の注記
if (rankingItems.length < 10) {
  articleContent += `※該当作品が10件に満たないため、本ランキングは${rankingItems.length}件で掲載しています。\n\n`;
}

// まとめセクション（マークダウン形式・必須）
articleContent += `## まとめ

今回ご紹介した${keyword}AVは、2025年にチェックしておきたい作品を、DMM/FANZAのデータをもとに、hentai-tokのライターエモリが厳選しました。

${getSummaryText(keyword)}

ぜひ今回ご紹介した作品で、${keyword}AVの魅力を存分に味わってください！

---

**出典：** DMM/FANZA`;

return articleContent;
```

### ステップ9: スクリプト実行
**重要**: スクリプトは`ohsawa`フォルダ内で実行するか、`ohsawa`フォルダへのパスを指定してください。

```bash
# ohsawaフォルダに移動してから実行
cd ohsawa
# Node.jsのフルパスを指定（PATHに追加されていない場合）
& "C:\Program Files\nodejs\node.exe" generate-{keyword}-article.js

# または、PATHに追加されている場合
node generate-{keyword}-article.js

# または、hentaitok-frontフォルダから実行する場合
node ohsawa/generate-{keyword}-article.js
```

### ステップ9.5: 評価スコアと★の追加（必須）

**重要**: すべてのランキング項目（1位〜10位）について、評価スコアと★を追加する。順位に応じて傾斜をつける。

#### 1. 評価スコアと★の計算方法

**必須**: 順位に応じて以下のように傾斜をつける：

```javascript
// 評価スコアと★を計算
function calculateScores(rank) {
  const baseScore = 100 - (rank - 1) * 2; // 1位:100点, 2位:98点, 3位:96点...
  const starRating = rank <= 2 ? 5 : rank <= 5 ? 4 : 3;
  
  // 各項目の評価（少しばらつきを持たせる）
  const fetishism = rank <= 2 ? 5 : rank <= 5 ? 4 : 3;
  const looks = rank <= 2 ? 5 : rank <= 5 ? 4 : 3;
  const sex = rank <= 2 ? 5 : rank <= 5 ? 4 : 3;
  
  return {
    baseScore,
    starRating,
    fetishism,
    looks,
    sex
  };
}

// 星の表示を生成
function generateStars(count) {
  const fullStars = '★'.repeat(count);
  const emptyStars = '☆'.repeat(5 - count);
  return fullStars + emptyStars;
}
```

#### 2. 評価セクションの追加方法

**必須**: 各ランキング項目の画像の後に、以下の形式で評価セクションを追加する：

```markdown
**評価**
- ◆①フェチズム：★★★★★
- ◆②ルックス・雰囲気：★★★★★
- ◆③セックス・絡みの完成度：★★★★★
- **総合：100点／100点**
```

#### 3. 実装例

```javascript
// 評価セクションを追加する関数
function addEvaluationSection(markdownContent, item, scores) {
  const rankLabel = item.rank === 1 ? `${item.rank}位` : `第${item.rank}位：`;
  const rankPattern = new RegExp(
    `(### ${rankLabel.replace(/[()]/g, '\\$&')}\\s+${item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?)(!\\[.*?サンプル画像2\\]\\([^)]+\\)\\n\\n)`,
    'i'
  );
  
  const match = markdownContent.match(rankPattern);
  if (match) {
    const beforeImages = match[1];
    const afterFirstImage = match[2];
    
    // 評価セクションを追加
    const evaluationSection = `**評価**
- ◆①フェチズム：${generateStars(scores.fetishism)}
- ◆②ルックス・雰囲気：${generateStars(scores.looks)}
- ◆③セックス・絡みの完成度：${generateStars(scores.sex)}
- **総合：${scores.baseScore}点／100点**

`;
    
    const newSection = beforeImages + afterFirstImage.replace(/\n\n/, '\n\n' + evaluationSection);
    markdownContent = markdownContent.replace(match[0], newSection);
  }
  
  return markdownContent;
}
```

#### 4. あらすじ・レビューを参照した「本作の最大の見どころ」の生成

**必須**: FANZAから取得したあらすじとユーザーレビューを参照して、「本作の最大の見どころ」を生成する。

**重要**: 
- 「本作の最大の見どころは」というワードは使わない
- 「設定」「背景がエロティシズムと相まって」などの定型文は避ける
- 具体的なシーンや臨場感のある描写を重視する
- 例：「会社で一番目立たないアラサー喪女、離婚したばかりのところにつけこみ食べにいくところの臨場感とだんだん心と股を開いていくエロさに勃起が止まりませんでした！」

**実装例:**

```javascript
// あらすじ・レビューから「本作の最大の見どころ」を生成
function generateHighlightFromFanza(item, fanzaInfo) {
  const { title, rank } = item;
  const description = fanzaInfo?.description || '';
  const reviews = fanzaInfo?.reviews || [];
  
  // あらすじから主要な要素を抽出
  const keyPoint = extractDescription(description, reviews, title);
  
  // レビューから具体的なシーンを抽出
  const reviewText = extractSceneFromReviews(reviews, title, keyPoint);
  
  let highlight = '';
  
  // レビューから具体的なシーンを抽出
  if (reviewText) {
    // レビューから具体的なシーンを抽出（例の形式に合わせる）
    const sceneMatch = reviewText.match(/(.{20,100}(?:シーン|場面|パンスト|タイツ|ストッキング|美脚|足|襲い|激イキ|失禁|汗だく|汁まみれ|理性を失い|満足度|臨場感|心と股を開いていく).{20,100})/);
    if (sceneMatch) {
      let sceneText = sceneMatch[1];
      // 長すぎる場合は切り詰める（文の途中で切らないように）
      if (sceneText.length > 150) {
        const cutPoint = sceneText.substring(0, 150).lastIndexOf('。');
        if (cutPoint > 50) {
          sceneText = sceneText.substring(0, cutPoint + 1);
        } else {
          sceneText = sceneText.substring(0, 150) + '...';
        }
      }
      
      // 例の形式に合わせる（「本作の最大の見どころは」は使わない）
      highlight = `${sceneText}。この展開には筆者も興奮が止まりませんでした！`;
    } else {
      // レビューの最初の部分を使用
      let reviewPart = reviewText.substring(0, 120);
      if (reviewText.length > 120) {
        const cutPoint = reviewPart.lastIndexOf('。');
        if (cutPoint > 50) {
          reviewPart = reviewPart.substring(0, cutPoint + 1);
        } else {
          reviewPart += '...';
        }
      }
      highlight = `${reviewPart}。この展開には筆者も興奮が止まりませんでした！`;
    }
  } else if (keyPoint) {
    // あらすじから具体的なシーンを抽出
    const sceneMatch = keyPoint.match(/(.{30,100}(?:パンスト|タイツ|ストッキング|美脚|足|射精|襲い|激イキ|失禁|汗だく|汁まみれ|臨場感|心と股を開いていく).{30,100})/);
    if (sceneMatch) {
      let sceneText = sceneMatch[1];
      if (sceneText.length > 150) {
        const cutPoint = sceneText.substring(0, 150).lastIndexOf('。');
        if (cutPoint > 50) {
          sceneText = sceneText.substring(0, cutPoint + 1);
        } else {
          sceneText = sceneText.substring(0, 150) + '...';
        }
      }
      highlight = `${sceneText}。この展開には筆者も興奮が止まりませんでした！`;
    } else {
      // タイトルから推測（定型文は避ける）
      const titleKeywords = extractTitleKeywords(title);
      highlight = `${titleKeywords}の臨場感とだんだん心と股を開いていくエロさに勃起が止まりませんでした！`;
    }
  } else {
    // タイトルから推測（定型文は避ける）
    const titleKeywords = extractTitleKeywords(title);
    highlight = `${titleKeywords}の臨場感とだんだん心と股を開いていくエロさに勃起が止まりませんでした！`;
  }
  
  return highlight;
}
```

### ステップ10: SEO最適化（最終チェック・必須）

**重要**: 記事生成後、必ずSEO最適化を実施すること。以下の項目をすべて確認・更新する。

#### 1. タイトルの最適化

**必須項目:**
- タイトルは60文字以内に収める
- 主要キーワード（女優名、ジャンル、ランキング、2025年など）を含める
- 検索されやすいキーワードを自然に配置

**実装例:**
```javascript
// タイトルの最適化
const seoTitle = `${keyword}AVおすすめランキング【2025年最新版】${keyword}を探すならhentaitok`;
// 60文字を超える場合は調整
const optimizedTitle = seoTitle.length > 60 
  ? `${keyword}AVおすすめランキング【2025年最新版】${keyword}作品を厳選`
  : seoTitle;
```

#### 2. メタディスクリプションの最適化

**必須項目:**
- メタディスクリプションは160文字以内に収める
- 主要キーワードを自然に含める
- 記事の内容を簡潔に要約
- ユーザーの検索意図に応える内容にする

**実装例:**
```javascript
// メタディスクリプションの最適化
const seoDescription = `${keyword}の中でも2025年にチェックしておきたい作品・出演者を、DMM/FANZAのデータをもとに、hentai-tokのライターエモリが厳選した作品をご紹介。肉感・密着感・出演本数で評価しています。`;
// 160文字を超える場合は調整
const optimizedDescription = seoDescription.length > 160
  ? seoDescription.substring(0, 157) + '...'
  : seoDescription;
```

#### 3. SEOキーワードの拡充

**必須項目:**
- 長尾キーワードを含める（例：「矢埜愛茉 おすすめ」「矢埜愛茉 ランキング」）
- 関連キーワードを追加（例：「水曜日のダウンタウン 矢埜愛茉」「SODクリエイト 矢埜愛茉」）
- 検索されやすいキーワードを網羅

**実装例:**
```javascript
// SEOキーワードの拡充
const seoKeywords = [
  keyword,
  `${keyword}AV`,
  `${keyword} おすすめ`,
  `${keyword} ランキング`,
  `${keyword} 2025`,
  `${keyword} 最新`,
  // 長尾キーワードを追加
  `${keyword} ${makerName}`, // メーカー名との組み合わせ
  `${keyword} ${actressName}`, // 女優名との組み合わせ（女優ランキングの場合）
  'AVランキング',
  'おすすめAV',
  '2025年AV',
  'FANZA',
  'DMM'
];
```

#### 4. 画像のalt属性の追加

**必須項目:**
- すべての画像に適切なalt属性を追加
- 各作品のタイトルを含む説明文にする
- キーワードを自然に含める

**実装例:**
```javascript
// 画像のalt属性を生成
function generateImageAlt(title, keyword, imageNumber) {
  // タイトルから主要な部分を抽出（長すぎる場合は短縮）
  const shortTitle = title.length > 30 
    ? title.substring(0, 30) + '...'
    : title;
  return `${keyword}AV作品「${shortTitle}」サンプル画像${imageNumber}`;
}

// 使用例
const imageAlt1 = generateImageAlt(item.title, keyword, 1);
const imageAlt2 = generateImageAlt(item.title, keyword, 2);

// マークダウン形式で出力
articleContent += `![${imageAlt1}](${imageUrl1})\n`;
articleContent += `![${imageAlt2}](${imageUrl2})\n`;
```

#### 5. タグの拡充

**必須項目:**
- 関連キーワードを追加
- 検索されやすいキーワードを網羅
- 長尾キーワードを含める

**実装例:**
```javascript
// タグの拡充
const tags = [
  keyword,
  `${keyword}AV`,
  `${keyword} おすすめ`,
  `${keyword} ランキング`,
  `${keyword} 2025`,
  `${keyword} 最新`,
  // 関連キーワードを追加
  'AVランキング',
  'おすすめAV',
  '2025年AV',
  'FANZA',
  'DMM'
];
```

#### 6. まとめセクションのSEO最適化

**必須項目:**
- キーワードを自然に配置
- 記事の内容を要約し、検索エンジンに理解しやすい構成にする
- 主要キーワードを複数回使用（過度なキーワード詰め込みは避ける）

**実装例:**
```javascript
// まとめセクションのSEO最適化
articleContent += `## まとめ

今回ご紹介した${keyword}AVおすすめランキング2025年最新版は、2025年にチェックしておきたい作品を、DMM/FANZAのデータをもとに、hentai-tokのライターエモリが厳選しました。

${keyword}の魅力を、ランキング形式でご紹介しました。様々なシチュエーションでの展開が組み合わさった作品は、他のジャンルでは味わえない特別な魅力があります。

ぜひ今回ご紹介した${keyword}AVおすすめランキング2025年最新版の作品で、${keyword}AVの魅力を存分に味わってください！`;
```

#### 7. SEO最適化チェックリスト

記事生成後、以下のチェックリストを確認すること：

- [ ] タイトルが60文字以内で、主要キーワードを含んでいるか
- [ ] メタディスクリプションが160文字以内で、主要キーワードを含んでいるか
- [ ] SEOキーワードに長尾キーワードが含まれているか
- [ ] すべての画像に適切なalt属性が設定されているか
- [ ] タグに関連キーワードが十分に含まれているか
- [ ] まとめセクションにキーワードが自然に配置されているか
- [ ] 記事全体でキーワードが適切な密度で使用されているか（過度なキーワード詰め込みは避ける）
- [ ] 見出しタグ（H1、H2、H3）が適切に使用されているか
- [ ] 内部リンクが適切に配置されているか
- [ ] 外部リンク（FANZAリンクなど）が適切に配置されているか

#### 8. SEO最適化スクリプトの実装例

```javascript
// SEO最適化を実施する関数
function optimizeSEO(article, keyword, rankingItems) {
  // 1. タイトルの最適化
  const optimizedTitle = optimizeTitle(article.title, keyword);
  
  // 2. メタディスクリプションの最適化
  const optimizedDescription = optimizeDescription(article.description, keyword);
  
  // 3. SEOキーワードの拡充
  const expandedKeywords = expandKeywords(keyword, rankingItems);
  
  // 4. 画像のalt属性の追加
  const optimizedContent = addImageAltAttributes(article.content, rankingItems, keyword);
  
  // 5. タグの拡充
  const expandedTags = expandTags(keyword, rankingItems);
  
  // 6. まとめセクションのSEO最適化
  const optimizedSummary = optimizeSummary(article.content, keyword);
  
  return {
    ...article,
    title: optimizedTitle,
    description: optimizedDescription,
    content: optimizedContent,
    tags: expandedTags,
    seo: {
      ...article.seo,
      keywords: expandedKeywords,
      description: optimizedDescription
    }
  };
}
```

### ステップ11: 生成ファイルの確認
- 生成先: `assets/articles/{keyword-sanitized}-av-ranking-2025.js`（`ohsawa`フォルダから見た相対パス）
- ファイルが正しく生成されているか確認
- ランキング件数が10件に満たない場合は注記が含まれているか確認
- 各ランキング項目に女優情報が含まれているか確認
- リンク構造が正しいか確認（`[スワイプで動画を観る]`、`[FANZAで購入する]`）
- **確認**: すべての作業ファイル（APIレスポンスJSON、スクリプトなど）が`ohsawa`フォルダ内に格納されているか確認
- **画像の形式確認**: 画像がMarkdown画像形式（`![画像識別用タグ](URL)`）で出力されているか確認（リンク形式ではない）
- **ボールド文字の確認**: 【】で囲まれた見出しとランキングの順位・タイトルがボールド文字になっているか確認
- **Meta Descriptionの確認**: `content`フィールドに`【Meta/H1】`セクションが含まれていないか確認（`seo`オブジェクトに正しく設定されているか確認）
- **画像の配置順序確認**: ランキング項目の画像が正しい順序（メーカーの後、評価の後）で配置されているか確認

---

## 4. エラーハンドリング

### よくあるエラーと対処法

1. **`require is not defined in ES module scope`**
   - 原因: package.jsonに`"type": "module"`が設定されている
   - 対処: `require`を`import`に変更、`__dirname`と`__filename`をES module形式で取得

2. **`JSON.parse error`**
   - 原因: JSONファイルにBOMや不正な文字が含まれている
   - 対処: BOM削除（`jsonContent.replace(/^\uFEFF/, '')`）

3. **`Node.jsが見つかりません`**
   - 原因: Node.jsがPATHに追加されていない
   - 対処: フルパスを指定（`& "C:\Program Files\nodejs\node.exe"`）

4. **メーカーフィルタリング後に10件未満**
   - 対処: 注記を追加し、そのまま記事を生成

5. **APIから0件取得**
   - 対処: allowSimilar=Yの場合は近似キーワードを試す、Nの場合はユーザーに確認

6. **女優情報が取得できない**
   - 対処: エラーをログ出力し、女優情報なしで記事を生成（女優情報部分は省略）

---

## 5. ファイル命名規則

**重要**: 以下のファイルはすべて`ohsawa`フォルダ内に格納してください（生成記事ファイルは除く）。

- APIレスポンス: `ohsawa/response-{keyword}-{genre_id}.json`
- 記事生成スクリプト: `ohsawa/generate-{keyword-sanitized}-article.js`
- 生成記事ファイル: `assets/articles/{keyword-sanitized}-av-ranking-2025.js`（`ohsawa`フォルダから見た相対パスで`../assets/articles/`に保存）

**keyword-sanitizedの例**:
- `女上司` → `joshishi`
- `ぽっちゃり` → `pocchari`
- `黒ギャル` → `kuro-gyaru`

---

## 6. チェックリスト

記事生成前に以下を確認：

- [ ] キーワードとgenre_idが正しく取得できているか
- [ ] APIからデータが正しく取得できているか
- [ ] VR作品が正しく除外されているか
- [ ] メーカーフィルタリングが正しく機能しているか
- [ ] ランキング件数が10件以上あるか（または注記があるか）
- [ ] 画像URLが正しく取得できているか
- [ ] 各ランキング項目の女優情報が取得できているか
- [ ] 記事本文がテンプレート通りに生成されているか
- [ ] リンク構造が正しいか（`[スワイプで動画を観る]`、`[FANZAで購入する]`）
- [ ] ファイル名が正しいか（keyword-sanitized）
- [ ] `assets/articles`ディレクトリに正しく保存されているか
- [ ] すべての作業ファイル（APIレスポンスJSON、スクリプトなど）が`ohsawa`フォルダ内に格納されているか

---

## 7. 使用例

### 例1: 女上司（genre_id: 6945, ランキングA, 近似キーワードY）
```
1. キーワード: 女上司
2. ランキング種別: A
3. 近似キーワード: Y
```

実行結果：
- API取得: 100件
- VR除外後: 70件（30件除外）
- フィルタリング後: 33件（37件除外）
- ランキング対象: 10件
- 生成ファイル: `assets/articles/joshishi-av-ranking-2025.js`
- 作業ファイル: `ohsawa/response-女上司-6945.json`、`ohsawa/generate-joshishi-article.js`（すべて`ohsawa`フォルダ内に格納）

---

## 8. 記事の後処理と最適化

### 8.1 記事ファイルへの追加項目

生成された記事ファイル（`.js`）には、以下の項目を追加する必要があります：

1. **`featuredImage`**: ランキング1位の動画の1番上の画像リンクを使用
   ```javascript
   featuredImage: "https://pics.dmm.co.jp/digital/video/{content_id}/{content_id}jp-1.jpg",
   ```

2. **`images`配列**: 関連画像の配列を追加
   ```javascript
   images: [
     {
       url: "https://pics.dmm.co.jp/digital/video/{content_id}/{content_id}jp-1.jpg",
       alt: "{keyword}AV女優のサムネイル",
       caption: "{year}年最新の{keyword}AV作品"
     }
   ],
   ```

### 8.2 マークダウン記法による最適化

記事のコンテンツは、ユーザーフレンドリーかつSEO最適化されたマークダウン記法で記述する必要があります：

#### 見出し構造
- メインタイトル: `# {keyword}AVおすすめランキング【{year}年最新版】`
- セクション見出し: `## ライターエモリがエロい「{keyword}」のおすすめAVを厳選！`
- 評価基準セクション: `## {keyword}AVの評価基準`
- ランキングセクション: `## {year}年最新｜{keyword}AVランキングTOP10`
- 各ランキング項目: `### {順位}位 {タイトル}（引用：FANZA／メーカー：{メーカー名}）`
- おすすめポイント: `#### おすすめポイント`

#### 評価表示の最適化
- 評価項目はリスト形式で表示
  ```markdown
  **評価**
  - ◆①フェチズム：★★★★★
  - ◆②ルックス・雰囲気：★★★★★
  - ◆③セックス・絡みの完成度：★★★★☆
  - **総合：93点／100点**
  ```

#### 画像の最適化
- 画像は適切なaltテキストと共に表示
  ```markdown
  ![サンプル画像1](https://pics.dmm.co.jp/digital/video/{content_id}/{content_id}jp-1.jpg)
  ```

#### まとめセクション
- まとめセクションは`## まとめ`として明確に区別
- 出典情報は水平線（`---`）の後に配置

### 8.3 実行例：joshishi-av-ranking-2025.jsの最適化

**実行日**: 2025年

**実行内容**:
1. `featuredImage`を追加（ランキング1位の画像: `https://pics.dmm.co.jp/digital/video/ipx00649/ipx00649jp-1.jpg`）
2. `images`配列を追加（関連画像情報を含む）
3. コンテンツをマークダウン記法で最適化：
   - 見出し構造を整理（`#`、`##`、`###`、`####`を使用）
   - 評価表示をリスト形式に変更
   - 各ランキング項目の見出しを統一（`### 第{順位}位：`形式）
   - おすすめポイントを`#### おすすめポイント`として明確化
   - まとめセクションを`## まとめ`として整理
   - 出典情報を水平線の後に配置

**変更前の形式**:
```markdown
**【ランキング種別】**
A：AV名作ランキング　※B未指定のためAで自動生成

**【SEOタイトル】**
女上司AVおすすめランキング【2025年最新版】女上司を探すならhentaitok
```

**変更後の形式**:
```markdown
# 女上司AVおすすめランキング【2025年最新版】

女上司と朝までハメるッ！女上司AV女優でシコれば、意識がトブほど気持ちいい射精ができちゃいます。
```

**効果**:
- SEO最適化: 適切な見出し階層により検索エンジンがコンテンツ構造を理解しやすくなる
- ユーザビリティ向上: マークダウン記法により読みやすく、構造化されたコンテンツになる
- 視覚的改善: 評価項目のリスト化により情報が整理され、視認性が向上

---

## 10. 注意事項

- **ファイルの保存場所**: 記事生成時に発生するすべてのファイル（APIレスポンスJSON、記事生成スクリプトなど）は`ohsawa`フォルダ内に格納してください。生成された記事ファイル（`.js`）のみ`assets/articles`に保存します。
- **URLを推測しない**: 画像は必ずAPIで取得したURLを使用する
- **成人向けの表現を使用**: プロンプトの制約に従う
- **メーカー名のマッチングは柔軟に**: 完全一致だけでなく、部分一致やカタカナ/英語変換も考慮
- **エスケープ処理**: 記事本文内のバッククォートや`${}`を適切にエスケープする
- **VR作品は必ず除外**: ジャンル名・タイトルの両方をチェック
- **非同期処理**: 女優情報の取得は非同期なので、`async/await`を適切に使用する

### 記事フォーマットに関する重要な注意事項

- **画像の形式**: 画像は必ずMarkdown画像形式（`![画像識別用タグ](URL)`）で出力する。リンク形式（`[画像識別用タグ](URL)`）は使用しない。
- **【】で囲まれた見出しはボールド文字**: すべての【】で囲まれた見出し（例：`【ランキング種別】`、`【SEOタイトル】`、`【まとめ】`など）は`**【見出し】**`のようにボールド文字にする。
- **ランキングの順位とタイトルはボールド文字**: 各ランキング項目の順位とAV名（例：`1位　AVタイトル`）は`**1位　AVタイトル**`のようにボールド文字にする。
- **Meta Descriptionはcontentに含めない**: Meta DescriptionなどのSEO情報は`content`フィールドには含めず、`seo`オブジェクトの`description`フィールドに正しく設定する。`content`内の`【Meta/H1】`セクションは削除する。
- **画像の配置順序**: ランキング項目の画像は以下の順序で配置する：
  1. 順位とタイトル（ボールド文字）
  2. メーカー
  3. 画像1（最初の画像、メーカーの直後）
  4. 登場AV女優名（女優情報がある場合）
  5. 評価（女優情報がある場合）
  6. 画像2（2枚目の画像、評価の後）
  7. おすすめポイント
  8. リンク（スワイプで動画を観る、FANZAで購入する）

---

## 11. トラブルシューティング

### Node.jsが見つからない
1. Node.jsがインストールされているか確認
2. PATHに追加されていない場合はフルパスを使用
3. PowerShellを再起動してPATHを再読み込み

### APIから0件取得
1. genre_idが正しいか確認（allTags.jsonで再確認）
2. 近似キーワードを試す
3. API URLが正しいか確認

### メーカーフィルタリング後に件数が少ない
1. 許可メーカーリストに該当メーカーが含まれているか確認
2. メーカー名の表記揺れを確認（カタカナ/英語、全角/半角）
3. 必要に応じて注記を追加

### 女優情報が取得できない
1. ActressSearch APIのURLが正しいか確認
2. 女優IDが正しいか確認（ItemList APIのレスポンスを確認）
3. エラーが発生しても記事生成は続行（女優情報部分は省略）

### VR作品が除外されない
1. ジャンル名のチェックロジックを確認
2. タイトルチェックロジックを確認
3. 大文字小文字の違いを考慮（`VR`、`vr`、`Vr`など）

---

以上が、hentaitok記事生成の完全なマスタープロンプトです。この手順に従うことで、Cursorで安定して記事生成作業を実行できます。