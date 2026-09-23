#!/usr/bin/env python3
"""
女優おすすめ記事を一括生成。ジャンル記事と同じ要領で、女優ごとに人気作品TOP10を取得し、
VR除外・許可メーカー絞り後に記事を出力。ファイル名に今日の日付を含める。
"""

from __future__ import annotations

import json
import os
import sys
import time
import urllib.parse
import urllib.request
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

from fetch_genre_ranking import (
    load_allowed_makers,
    filter_items,
    filter_items_by_target_id,
    get_content_id,
    get_actress_ids,
    resolve_actress_name,
)
from batch_generate_articles import (
    item_genre_tags,
    item_image_url,
    item_review,
    item_price,
    get_section_titles,
    item_intro_paragraph,
    bullet_points,
)


def fetch_item_list_by_actress(api_id: str, affiliate_id: str, actress_id: int) -> list[dict]:
    base = "https://api.dmm.com/affiliate/v3/ItemList"
    params = {
        "api_id": api_id,
        "affiliate_id": affiliate_id,
        "site": "FANZA",
        "service": "digital",
        "floor": "videoa",
        "hits": "100",
        "offset": "1",
        "sort": "rank",
        "article": "actress",
        "article_id": str(actress_id),
        "output": "json",
    }
    url = f"{base}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "AVScope-ArticleGen/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = json.loads(res.read().decode("utf-8"))
    return data.get("result", {}).get("items", []) or []


# 女優IDリスト（ジャンル記事に登場した女優＋既存特集から選定。必要に応じて増減可）
ACTRESS_IDS = [
    1000704, 1001148, 1001592, 1002706, 1003758, 1003808, 1004455, 1004672, 1005331,
    1008769, 1008785, 1008887, 1008965, 1010958, 1011094, 1012352, 1012910, 1013400,
    1014614, 1016110, 1017139, 1018986, 1019300, 1019329, 1019454, 1020173, 1020285,
    1020504, 1020522, 1020685, 1020690, 1021359, 1021367, 1021801, 1021901, 1022129,
    1024404, 1024433, 1024513, 1025436,
    1092091, 1088602, 1076785, 1069697, 1044864, 1054998, 1059080, 1072361, 1070303,
    1072360, 1098402, 1081600, 1062051, 1075302,
]


def build_actress_article(actress_id: int, actress_name: str, ranking: list[dict], date_str: str) -> str:
    slug = f"actress-{actress_id}-ranking-{date_str}"
    year = date_str[:4]
    related_items = [get_content_id(i) for i in ranking if get_content_id(i)]
    related_actresses = [str(actress_id)]
    first_img = item_image_url(ranking[0]) if ranking else ""
    desc = f"{actress_name}さんの人気動画ランキングTOP10。DMM/FANZAのランキングから厳選。レビュー評価と価格付きで紹介。AV Scopeで{actress_name}の作品を探すならこちら。"
    if len(desc) > 160:
        desc = desc[:157] + "..."

    lines = [
        "---",
        f"slug: {slug}",
        f"title: {actress_name} 人気動画ランキング【{year}年最新版】TOP10",
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
        f"  - {actress_name}",
        "  - 人気動画",
        "keywords:",
        f"  - {actress_name}",
        "  - ランキング",
        "  - 人気動画",
        "  - DMM",
        "  - AV",
        f"ogImage: {first_img}" if first_img else "ogImage: ''",
        f"canonicalUrl: https://www.avscope.jp/articles/{slug}",
        "featured: true",
        "priority: 90",
        "relatedItems:",
    ]
    for cid in related_items:
        lines.append(f"  - {cid}")
    lines.append("relatedActresses:")
    lines.append(f"  - {actress_id}")
    lines.append("---")
    lines.append("")
    lines.append(f"## {actress_name} 人気動画ランキング TOP10")
    lines.append("")
    lines.append(f"**{actress_name}**さんの人気動画ランキングTOP10をご紹介。DMM/FANZAのランキングから、レビュー評価・価格付きで厳選しました。")
    lines.append("")
    lines.append(f"[{actress_name}さんの出演作品一覧](/actress/{actress_id})からも探せます。")
    lines.append("")
    lines.append("---")
    lines.append("")

    for idx, item in enumerate(ranking):
        rank = idx + 1
        cid = get_content_id(item)
        title = (item.get("title") or "").strip()
        title_display = title[:80] + "…" if len(title) > 80 else title
        aff = (item.get("affiliateURL") or item.get("URL") or "").strip()
        img = item_image_url(item)
        tags = item_genre_tags(item)
        tag_str = " ".join(f"`{t}`" for t in tags[:6])
        avg, cnt = item_review(item)
        price = item_price(item)

        intro_heading, bullets_heading = get_section_titles(idx)

        lines.append(f"### {rank}. [{title_display}](/item/{cid})（{cid}）")
        lines.append("")
        if img:
            lines.append(f"[![{actress_name} {title_display[:30]}]({img})](/item/{cid})")
        lines.append("")
        lines.append(f"**{intro_heading}**  ")
        lines.append(item_intro_paragraph(actress_name, item, for_actress_article=True))
        lines.append("")
        lines.append(f"**{bullets_heading}**")
        for pt in bullet_points(item, actress_name, for_actress_article=True):
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
    lines.append(f"今回ご紹介した{actress_name}さんの人気動画ランキングは、DMM/FANZAのデータをもとにAV Scopeが厳選したTOP10です。気になる作品は詳細ページで無料動画もチェックできます。")
    lines.append("")
    lines.append(f"**{actress_name}をもっと探す**  ")
    lines.append(f"- [女優ページ：{actress_name}](/actress/{actress_id})  ")
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

    allowed = load_allowed_makers()
    script_dir = SCRIPT_DIR
    articles_dir = REPO_ROOT / "content" / "articles"
    articles_dir.mkdir(parents=True, exist_ok=True)
    date_str = date.today().strftime("%Y-%m-%d")
    print(f"Output date: {date_str}", file=sys.stderr)
    created = 0
    skipped = 0

    for i, actress_id in enumerate(ACTRESS_IDS):
        print(f"[{i+1}/{len(ACTRESS_IDS)}] Fetch actress_id={actress_id}", file=sys.stderr)
        try:
            raw = fetch_item_list_by_actress(api_id, affiliate_id, actress_id)
            items = filter_items(raw, allowed)
            # DMM 取得後に指定 ActressID と照合（複数女優紐づきの取り違え防止）
            items = filter_items_by_target_id(items, actress_id=actress_id)
            # 単体女優作品を優先（3件以上あれば単体のみ、なければ複数女優も許可）
            solo_items = [it for it in items if len(it.get("iteminfo", {}).get("actress", []) or []) == 1]
            multi_items = [it for it in items if len(it.get("iteminfo", {}).get("actress", []) or []) > 1]
            print(f"  Solo actress items: {len(solo_items)}, Multi actress items: {len(multi_items)}", file=sys.stderr)
            if len(solo_items) >= 3:
                ranking = solo_items[:10]
                print(f"  Using solo actress items only ({len(ranking)} items)", file=sys.stderr)
            else:
                ranking = (solo_items + multi_items)[:10]
                print(f"  Not enough solo items, mixing with multi: solo={len(solo_items)}, total={len(ranking)}", file=sys.stderr)
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

        # actress[0] ではなく指定 ActressID に一致する名前を使う
        actress_name = resolve_actress_name(ranking, actress_id) or f"女優ID{actress_id}"
        if not actress_name or actress_name == "不明":
            actress_name = f"女優ID{actress_id}"

        json_path = script_dir / f"response-actress-{actress_id}-{date_str}.json"
        payload = {
            "actress_id": actress_id,
            "actress_name": actress_name,
            "total_before_filter": len(raw),
            "total_after_filter": len(items),
            "result": {"items": ranking},
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        md_content = build_actress_article(actress_id, actress_name, ranking, date_str)
        md_path = articles_dir / f"actress-{actress_id}-ranking-{date_str}.md"
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        print(f"  -> {md_path.name} ({actress_name}, {len(ranking)} items)", file=sys.stderr)
        created += 1

        # 記事生成に成功したらJSONを削除
        try:
            if json_path.is_file():
                json_path.unlink()
        except Exception:
            print(f"  (warn) could not remove {json_path}", file=sys.stderr)
        time.sleep(1.5)

    print(f"\nDone. Created {created} articles, skipped {skipped}.", file=sys.stderr)


if __name__ == "__main__":
    main()
