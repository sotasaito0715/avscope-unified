#!/usr/bin/env python3
"""
AV Scope 記事生成用：ジャンルキーワードからDMM APIでランキングデータを取得し、
VR除外・許可メーカーフィルタをかけてTOP10を抽出する。

使い方:
  export DMM_API_ID=xxx DMM_AFFILIATE_ID=yyy  # または .env に記載
  python scripts/article-generation/fetch_genre_ranking.py 人妻
  python scripts/article-generation/fetch_genre_ranking.py 女上司 --allow-similar

出力:
  - scripts/article-generation/response-{keyword}-{genre_id}.json にAPI結果（フィルタ後）を保存
  - 標準出力に Front Matter 用の relatedItems / relatedActresses をYAMLで表示
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

# プロジェクトルートをパスに追加（data/, .env 参照用）
REPO_ROOT = Path(__file__).resolve().parents[2]
os.chdir(REPO_ROOT)

# .env の読み込み（任意）
try:
    from dotenv import load_dotenv
    load_dotenv(REPO_ROOT / ".env.local")
except ImportError:
    pass

# 許可メーカーリスト（MASTER_PROMPT_ARTICLE_GENERATION.md の「許可メーカーリスト」と同期すること。ここは代表例）
ALLOWED_MAKERS_RAW = """
Aircontrol, BeFree, E-BODY, Fitch, HHH,
kawaii*, kira☆kira, MVG, OPERA, OPPAI,
ROOKIE, Ｖ, アタッカーズ, えむっ娘ラボ, ダスッ！,
NPJ(旧：ナンパJAPAN), はじめ企画, ビビアン, ワンズファクトリー,
痴女ヘヴン, 変態紳士倶楽部, 本中, 未満, 無垢, 溜池ゴロー,
アイデアポケット, PREMIUM, Madonna, マドンナ, MOODYZ,
グローバルメディアエンタテインメント, グローバルメディアアネックス,
桃太郎映像出版, ドグマ, アリスJAPAN, 宇宙企画,
ケイ・エム・プロデュース, BAZOOKA, メディアステーション,
S1, MUTEKI, ルネピクチャーズ, 豊彦, DOC,
アイドル・芸能人, 未満, 無垢, 溜池ゴロー,
アタッカーズ, えむっ娘ラボ, ダスッ！, はじめ企画, ビビアン, ワンズファクトリー,
"""


def _normalize(s: str) -> str:
    return (s or "").strip().lower()


def load_allowed_makers() -> list[str]:
    makers = []
    for line in ALLOWED_MAKERS_RAW.strip().splitlines():
        for part in line.split(","):
            m = part.strip()
            if m and m not in makers:
                makers.append(m)
    return makers


def load_genres(path: Path) -> list[dict]:
    with open(path, "r", encoding="utf-8") as f:
        data = f.read().lstrip("\uFEFF")
    return json.loads(data)


def find_genre_id(keyword: str, genres: list[dict], allow_similar: bool) -> tuple[int | None, str]:
    """キーワードに一致する genre_id を返す。見つかれば (genre_id, genre_name)、なければ (None, '')。"""
    kw_norm = _normalize(keyword)
    exact = []
    partial = []
    for g in genres:
        name = (g.get("genre_name") or "").strip()
        if not name:
            continue
        name_norm = _normalize(name)
        if name_norm == kw_norm:
            exact.append((g["genre_id"], name))
        elif kw_norm in name_norm or name_norm in kw_norm:
            partial.append((g["genre_id"], name))
    if exact:
        return exact[0][0], exact[0][1]
    if partial:
        return partial[0][0], partial[0][1]
    if allow_similar:
        for g in genres:
            name = (g.get("genre_name") or "").strip()
            if keyword in name or name in keyword:
                return g["genre_id"], name
    return None, ""


def fetch_item_list(api_id: str, affiliate_id: str, genre_id: int) -> list[dict]:
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
        "article": "genre",
        "article_id": str(genre_id),
        "output": "json",
    }
    url = f"{base}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "AVScope-ArticleGen/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = json.loads(res.read().decode("utf-8"))
    return data.get("result", {}).get("items", []) or []


def is_vr(item: dict) -> bool:
    title = (item.get("title") or "").strip()
    if "VR" in title or "【VR】" in title or "vr" in title.lower():
        return True
    for g in item.get("iteminfo", {}).get("genre", []) or []:
        name = (g.get("name") or "").strip()
        if "VR" in name or "vr" in name.lower():
            return True
    return False


def maker_allowed(maker_name: str, allowed: list[str]) -> bool:
    mn = (maker_name or "").strip()
    if not mn:
        return False
    mn_norm = _normalize(mn)
    for a in allowed:
        a_norm = _normalize(a)
        if mn_norm == a_norm:
            return True
        if a_norm in mn_norm or mn_norm in a_norm:
            return True
    if "マドンナ" in mn or "Madonna" in mn:
        return any("madonna" in _normalize(x) or "マドンナ" in x for x in allowed)
    return False


def filter_items(items: list[dict], allowed_makers: list[str]) -> list[dict]:
    filtered = []
    for item in items:
        if is_vr(item):
            continue
        maker = ""
        info = item.get("iteminfo") or {}
        makers = info.get("maker") or []
        if makers and isinstance(makers[0], dict):
            maker = (makers[0].get("name") or "").strip()
        if not maker:
            maker = (item.get("maker") or {}).get("name", "") if isinstance(item.get("maker"), dict) else ""
        if maker_allowed(maker, allowed_makers):
            filtered.append(item)
    return filtered


def get_content_id(item: dict) -> str:
    return (item.get("content_id") or "").strip()


def get_actress_ids(item: dict) -> list[str]:
    ids = []
    for a in item.get("iteminfo", {}).get("actress", []) or []:
        if isinstance(a, dict) and a.get("id"):
            ids.append(str(a["id"]))
        elif isinstance(a, str):
            ids.append(str(a))
    return ids


def find_actress_in_item(item: dict, actress_id: int | str) -> dict | None:
    """商品に紐づく女優から指定 ID に一致するものを返す（複数女優時の取り違え防止）。"""
    target = str(actress_id)
    for a in item.get("iteminfo", {}).get("actress", []) or []:
        if isinstance(a, dict) and a.get("id") is not None and str(a["id"]) == target:
            return {"id": str(a["id"]), "name": (a.get("name") or "").strip()}
    return None


def find_genre_in_item(item: dict, genre_id: int | str) -> dict | None:
    """商品に紐づくジャンルから指定 ID に一致するものを返す（複数ジャンル時の取り違え防止）。"""
    target = str(genre_id)
    for g in item.get("iteminfo", {}).get("genre", []) or []:
        if isinstance(g, dict) and g.get("id") is not None and str(g["id"]) == target:
            return {"id": str(g["id"]), "name": (g.get("name") or "").strip()}
    return None


def resolve_actress_name(items: list[dict], actress_id: int | str) -> str:
    for item in items:
        hit = find_actress_in_item(item, actress_id)
        if hit and hit.get("name"):
            return hit["name"]
    return ""


def resolve_genre_name(items: list[dict], genre_id: int | str) -> str:
    for item in items:
        hit = find_genre_in_item(item, genre_id)
        if hit and hit.get("name"):
            return hit["name"]
    return ""


def filter_items_by_target_id(items: list[dict], *, actress_id: int | str | None = None, genre_id: int | str | None = None) -> list[dict]:
    """DMM 取得後に指定 ActressID / GenreID と照合し、一致しない商品を除外する。"""
    if actress_id is not None:
        return [i for i in items if find_actress_in_item(i, actress_id)]
    if genre_id is not None:
        return [i for i in items if find_genre_in_item(i, genre_id)]
    return items


def main() -> None:
    args = sys.argv[1:]
    if not args:
        print("Usage: python fetch_genre_ranking.py <keyword> [--allow-similar]", file=sys.stderr)
        sys.exit(1)
    keyword = args[0]
    allow_similar = "--allow-similar" in args

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
    genre_id, genre_name = find_genre_id(keyword, genres, allow_similar)
    if genre_id is None:
        print(f"Genre not found for keyword: {keyword}", file=sys.stderr)
        sys.exit(1)

    print(f"Genre: genre_id={genre_id}, genre_name={genre_name}", file=sys.stderr)

    raw_items = fetch_item_list(api_id, affiliate_id, genre_id)
    print(f"Fetched {len(raw_items)} items", file=sys.stderr)

    allowed = load_allowed_makers()
    items = filter_items(raw_items, allowed)
    print(f"After VR + maker filter: {len(items)} items", file=sys.stderr)

    ranking = items[:10]
    if len(ranking) < 10:
        print(f"Note: only {len(ranking)} items (add note in article if needed)", file=sys.stderr)

    out_dir = Path(__file__).resolve().parent
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_kw = re.sub(r"[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+", "-", keyword).strip("-") or "genre"
    out_file = out_dir / f"response-{safe_kw}-{genre_id}.json"
    payload = {
        "keyword": keyword,
        "genre_id": genre_id,
        "genre_name": genre_name,
        "total_before_filter": len(raw_items),
        "total_after_filter": len(items),
        "result": {"items": ranking},
    }
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Saved: {out_file}", file=sys.stderr)

    related_items = [get_content_id(i) for i in ranking if get_content_id(i)]
    related_actresses: list[str] = []
    seen: set[str] = set()
    for i in ranking:
        for aid in get_actress_ids(i):
            if aid and aid not in seen:
                seen.add(aid)
                related_actresses.append(aid)

    print("\n# Front Matter 用（content/articles/*.md の relatedItems / relatedActresses にコピー）\n")
    print("relatedItems:")
    for cid in related_items:
        print(f"  - {cid}")
    print("relatedActresses:")
    for aid in related_actresses:
        print(f"  - {aid}")


if __name__ == "__main__":
    main()
