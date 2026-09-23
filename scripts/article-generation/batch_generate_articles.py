#!/usr/bin/env python3
"""
複数ジャンルでAPI取得→記事生成を一括実行する。
DMM APIを叩くため、ジャンルごとに1.5秒スリープを入れる。
"""

from __future__ import annotations

import json
import os
import re
import sys
import time
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT_DIR = Path(__file__).resolve().parent
os.chdir(REPO_ROOT)
sys.path.insert(0, str(SCRIPT_DIR))

try:
    from dotenv import load_dotenv
    load_dotenv(REPO_ROOT / ".env.local")
except ImportError:
    pass

# fetch_genre_ranking のロジックを再利用
from fetch_genre_ranking import (
    load_allowed_makers,
    load_genres,
    find_genre_id,
    fetch_item_list,
    filter_items,
    filter_items_by_target_id,
    get_content_id,
    get_actress_ids,
    resolve_genre_name,
)

# 記事を生成するジャンル（制服は既存 seifuku があるのでスキップ可）
GENRE_NAMES = [
    "人妻・主婦",
    "熟女",
    "女子校生",
    "美少女",
    "女教師",
    "痴女",
    "ギャル",
    "メイド",
    "OL",
    "若妻・幼妻",
    "お姉さん",
    "美乳",
    "義母",
    "未亡人",
    "女子大生",
    "秘書",
    "看護婦・ナース",
    "お母さん",
    "キャバ嬢・風俗嬢",
    "不倫",
    "ナンパ",
    "寝取り・寝取られ・NTR",
    "近親相姦",
    "中出し",
    "巨乳",
    "スレンダー",
    "単体作品",
    "乱交",
    "ハーレム",
    "コスプレ",
    "水着",
    "フェラ",
    "キス・接吻",
    "潮吹き",
    "ハメ撮り",
    "主観",
    "ドラマ",
    "羞恥",
    "拘束",
    "巫女",
    "裸エプロン",
    "ニーソックス",
    "ウェイトレス",
    "家庭教師",
    "インストラクター",
    "モデル",
    "お嬢様・令嬢",
    "処女",
    "孕ませ",
]


def item_maker(item: dict) -> str:
    info = item.get("iteminfo") or {}
    makers = info.get("maker") or []
    if makers and isinstance(makers[0], dict):
        return (makers[0].get("name") or "").strip()
    return (item.get("maker") or {}).get("name", "") if isinstance(item.get("maker"), dict) else ""


def item_actress(item: dict) -> str:
    actresses = (item.get("iteminfo") or {}).get("actress") or []
    if actresses and isinstance(actresses[0], dict):
        return (actresses[0].get("name") or "").strip()
    return ""


def item_genre_tags(item: dict, limit: int = 6) -> list[str]:
    genres = (item.get("iteminfo") or {}).get("genre") or []
    return [(g.get("name") or "").strip() for g in genres if (g.get("name") or "").strip()][:limit]


def item_image_url(item: dict) -> str:
    img = (item.get("imageURL") or {}).get("large")
    if img:
        return img
    sample = (item.get("sampleImageURL") or {}).get("sample_l") or {}
    images = sample.get("image") or []
    return images[0] if images else ""


def item_review(item: dict) -> tuple[str, int]:
    r = item.get("review") or {}
    return (str(r.get("average") or "").strip(), int(r.get("count") or 0))


def item_price(item: dict) -> str:
    p = (item.get("prices") or {}).get("price") or ""
    return str(p).strip()


# ランキング項目ごとに異なるセクション見出し（順番にローテーション）
SECTION_VARIATIONS = [
    ("この作品の魅力", "こんな人におすすめ"),
    ("あらすじ・見どころ", "評価ポイント"),
    ("作品のポイント", "注目のシーン・演出"),
    ("おすすめポイント", "購入前にチェック"),
    ("見どころ", "レビューから見るポイント"),
    ("作品の特徴", "押さえておきたいポイント"),
    ("この一本の魅力", "視聴のポイント"),
    ("作品紹介", "気になるポイント"),
    ("概要", "おすすめ理由"),
    ("この作品の見どころ", "チェックしたいポイント"),
]


def get_section_titles(rank_index: int) -> tuple[str, str]:
    """ランク順（0-based）に対応するセクション見出しのペアを返す。"""
    intro, bullets = SECTION_VARIATIONS[rank_index % len(SECTION_VARIATIONS)]
    return (intro, bullets)


def item_intro_paragraph(keyword: str, item: dict, *, for_actress_article: bool = False) -> str:
    """作品紹介の段落（2〜4文程度）を返す。"""
    title = (item.get("title") or "").strip()
    maker = item_maker(item)
    actress = item_actress(item)
    vol = (item.get("volume") or "").strip()
    avg, cnt = item_review(item)
    sentences = []
    if actress and maker:
        sentences.append(f"{actress}出演、{maker}の一本。")
    elif actress:
        sentences.append(f"{actress}が出演する作品。")
    elif maker and not for_actress_article:
        sentences.append(f"{maker}からリリースされた{keyword}系の一本。")
    if for_actress_article:
        sentences.append("この女優の作品として人気ランキングに登場しています。")
    elif keyword and keyword not in (title[:25] or ""):
        sentences.append(f"{keyword}ジャンルの人気作としてランキングに登場しています。")
    if vol:
        sentences.append(f"収録時間は{vol}分。")
    if avg and cnt:
        sentences.append(f"レビュー評価は{avg}/5（{cnt}件）で、視聴者からの支持も得ています。")
    if not sentences:
        sentences.append("人気の作品です。" if for_actress_article else f"{keyword}ジャンルで人気の作品です。")
    return "".join(sentences)


def bullet_points(item: dict, keyword: str, max_points: int = 5, *, for_actress_article: bool = False) -> list[str]:
    """見出し下の箇条書き（文で少し長め、最大5件）。"""
    tags = item_genre_tags(item, 6)
    vol = (item.get("volume") or "").strip()
    avg, cnt = item_review(item)
    points = []
    if tags:
        tag_lead = " ".join(tags[:3])
        points.append(f"**{tag_lead}**といったジャンルが揃っており、好みに合うかチェックしやすい。")
    if vol:
        points.append(f"収録時間は**{vol}分**で、たっぷり楽しめる尺になっている。")
    if avg and cnt:
        points.append(f"レビューは**{avg}/5（{cnt}件）**。評価の高さが人気の理由の一つ。")
    points.append("この女優の作品を探している人におすすめの一本。" if for_actress_article else f"{keyword}系の作品を探している人におすすめの一本。")
    if len(points) < 3:
        points.append("DMM/FANZAの人気ランキングで上位に食い込んでいる作品。")
    return points[:max_points]


def one_line_review(keyword: str, item: dict) -> str:
    """後方互換用：段落の1文目相当を返す。"""
    return item_intro_paragraph(keyword, item).split("。")[0] + "。"


def build_article(keyword: str, genre_id: int, genre_name: str, ranking: list[dict], date_str: str) -> str:
    slug = f"genre-{genre_id}-ranking-{date_str}"
    year = date_str[:4]
    related_items = [get_content_id(i) for i in ranking if get_content_id(i)]
    related_actresses: list[str] = []
    seen: set[str] = set()
    for i in ranking:
        for aid in get_actress_ids(i):
            if aid and aid not in seen:
                seen.add(aid)
                related_actresses.append(aid)

    first_img = item_image_url(ranking[0]) if ranking else ""
    desc = f"{genre_name}ジャンルの人気AVをDMM/FANZAのランキングから厳選。レビュー評価と価格付きでTOP10を紹介。AV Scopeで{genre_name}作品を探すならこちら。"
    if len(desc) > 160:
        desc = desc[:157] + "..."

    lines = [
        "---",
        f"slug: {slug}",
        f"title: {genre_name}AVおすすめランキング【{year}年最新版】人気作品TOP10",
        f"description: {desc}",
        "published: true",
        f"publishedAt: {date_str}T00:00:00Z",
        f"updatedAt: {date_str}T00:00:00Z",
        "author:",
        "  name: AV Scope編集部",
        "  role: 編集長",
        "category: ランキング",
        "tags:",
        "  - ランキング",
        f"  - {genre_name}",
        "  - おすすめ",
        "keywords:",
        f"  - {genre_name}",
        "  - ランキング",
        "  - DMM",
        "  - FANZA",
        f"ogImage: {first_img}" if first_img else "ogImage: ''",
        f"canonicalUrl: https://www.avscope.jp/articles/{slug}",
        "featured: true",
        "priority: 90",
        "relatedItems:",
    ]
    for cid in related_items:
        lines.append(f"  - {cid}")
    lines.append("relatedActresses:")
    for aid in related_actresses[:20]:
        lines.append(f"  - {aid}")
    lines.append("---")
    lines.append("")
    lines.append(f"## {genre_name}AVを探すならAV Scope！")
    lines.append("")
    lines.append(f"**{genre_name}AVを探しているあなたへ。** AV Scopeは、DMM/FANZAのデータで人気ランキング・ジャンル検索ができるAV検索サイトです。{genre_name}の作品をランキングやジャンルからすぐ探せます。")
    lines.append("")
    lines.append(f"**{genre_name}AVをジャンルから探す**: [ジャンルから{genre_name}を探す](/genre/{genre_id})")
    lines.append("")
    lines.append(f"{genre_name}ジャンルの人気作品を、DMM/FANZAのランキングからTOP10でご紹介します。")
    lines.append("")
    lines.append("---")
    lines.append("")

    for idx, item in enumerate(ranking):
        rank = idx + 1
        cid = get_content_id(item)
        title = (item.get("title") or "").strip()
        # リンク用: タイトル内の ] はエスケープしないとMarkdownが壊れるので短くする場合あり
        title_display = title[:80] + "…" if len(title) > 80 else title
        aff = (item.get("affiliateURL") or item.get("URL") or "").strip()
        img = item_image_url(item)
        tags = item_genre_tags(item)
        tag_str = " ".join(f"`{t}`" for t in tags[:6])
        vol = (item.get("volume") or "").strip()
        avg, cnt = item_review(item)
        price = item_price(item)

        intro_heading, bullets_heading = get_section_titles(idx)

        rank_label = f"{rank}位" if rank == 1 else f"第{rank}位："
        lines.append(f"### {rank_label} [{title_display}](/item/{cid})（{cid}）")
        lines.append("")
        if img:
            lines.append(f"[![{genre_name} {title_display[:30]}]({img})](/item/{cid})")
        lines.append("")
        lines.append(f"**{intro_heading}**  ")
        lines.append(item_intro_paragraph(genre_name, item))
        lines.append("")
        lines.append(f"**{bullets_heading}**")
        for pt in bullet_points(item, genre_name):
            lines.append(f"- {pt}")
        lines.append("")
        lines.append("**ジャンル／価格メモ**  ")
        lines.append(f"{tag_str}  ")
        if avg and cnt:
            lines.append(f"レビュー **{avg}/5（{cnt}件）**。")
        if price:
            lines.append(f"ストリーミング{price}〜。")
        lines.append("")
        lines.append(f"[▶ 詳細を見る](/item/{cid}) ｜ [購入ページへ]({aff})")
        lines.append("")
        lines.append("---")
        lines.append("")

    if len(ranking) < 10:
        lines.append(f"※該当作品が10件に満たないため、本ランキングは{len(ranking)}件で掲載しています。")
        lines.append("")
        lines.append("---")
        lines.append("")

    lines.append("## まとめ")
    lines.append("")
    lines.append(f"今回ご紹介した{genre_name}AVランキングは、DMM/FANZAの人気データをもとにAV Scopeが厳選したTOP10です。気になる作品は詳細ページで無料動画もチェックできます。")
    lines.append("")
    lines.append(f"**{genre_name}をもっと探す**  ")
    lines.append(f"- [ジャンル：{genre_name}](/genre/{genre_id})  ")
    lines.append("- [人気ランキング](/)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("**出典：** DMM/FANZA")

    return "\n".join(lines)


def main() -> None:
    api_id = os.getenv("DMM_API_ID")
    affiliate_id = os.getenv("DMM_AFFILIATE_ID")
    if not api_id or not affiliate_id:
        print("Set DMM_API_ID and DMM_AFFILIATE_ID (e.g. in .env.local)", file=sys.stderr)
        sys.exit(1)

    genres_path = REPO_ROOT / "data" / "genres" / "genres_summary.json"
    if not genres_path.is_file():
        print(f"Not found: {genres_path}", file=sys.stderr)
        sys.exit(1)

    genres = load_genres(genres_path)
    allowed = load_allowed_makers()
    script_dir = SCRIPT_DIR
    articles_dir = REPO_ROOT / "content" / "articles"
    articles_dir.mkdir(parents=True, exist_ok=True)

    # 既存の制服記事はスキップ（genre_id=48）
    skip_genre_ids = {48}

    date_str = date.today().strftime("%Y-%m-%d")
    print(f"Output date: {date_str}", file=sys.stderr)
    created = 0
    skipped = 0
    for i, keyword in enumerate(GENRE_NAMES):
        genre_id, genre_name = find_genre_id(keyword, genres, True)
        if genre_id is None:
            print(f"[{i+1}/{len(GENRE_NAMES)}] Skip (not found): {keyword}", file=sys.stderr)
            skipped += 1
            continue
        if genre_id in skip_genre_ids:
            print(f"[{i+1}/{len(GENRE_NAMES)}] Skip (existing): {keyword} (id={genre_id})", file=sys.stderr)
            skipped += 1
            continue

        print(f"[{i+1}/{len(GENRE_NAMES)}] Fetch: {genre_name} (id={genre_id})", file=sys.stderr)
        try:
            raw = fetch_item_list(api_id, affiliate_id, genre_id)
            items = filter_items(raw, allowed)
            # DMM 取得後に指定 GenreID と照合（複数ジャンル紐づきの取り違え防止）
            items = filter_items_by_target_id(items, genre_id=genre_id)
            ranking = items[:10]
        except Exception as e:
            print(f"  Error: {e}", file=sys.stderr)
            skipped += 1
            time.sleep(1.5)
            continue

        if not ranking:
            print(f"  No items after filter, skip", file=sys.stderr)
            skipped += 1
            time.sleep(1.5)
            continue

        # マスタ名を優先し、無い場合は商品内の GenreID 照合結果を使う
        resolved_genre_name = genre_name or resolve_genre_name(ranking, genre_id) or keyword

        # JSON保存（記事生成後に削除する一時ファイル）
        safe_kw = re.sub(r"[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+", "-", keyword).strip("-") or "genre"
        json_path = script_dir / f"response-{safe_kw}-{genre_id}.json"
        payload = {
            "keyword": keyword,
            "genre_id": genre_id,
            "genre_name": resolved_genre_name,
            "total_before_filter": len(raw),
            "total_after_filter": len(items),
            "result": {"items": ranking},
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        # 記事生成
        md_content = build_article(keyword, genre_id, resolved_genre_name, ranking, date_str)
        md_path = articles_dir / f"genre-{genre_id}-ranking-{date_str}.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"  -> {md_path.name} ({len(ranking)} items)", file=sys.stderr)
        created += 1

        # 記事生成に成功したらJSONを削除
        try:
            if json_path.is_file():
                json_path.unlink()
        except Exception:
            # ログだけ出して処理は続行
            print(f"  (warn) could not remove {json_path}", file=sys.stderr)

        time.sleep(1.5)

    print(f"\nDone. Created {created} articles, skipped {skipped}.", file=sys.stderr)


if __name__ == "__main__":
    main()
