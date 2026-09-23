#!/usr/bin/env bash

set -euo pipefail

# 環境変数の読み込み（.env.localから）
if [ -f .env.local ]; then
  export $(grep -E "^DMM_API_ID|^DMM_AFFILIATE_ID" .env.local | grep -v '^#' | xargs)
fi

API_ID="${DMM_API_ID:-${API_ID:-}}"
AFFILIATE_ID="${DMM_AFFILIATE_ID:-${AFFILIATE_ID:-}}"
HITS="${HITS:-500}"
OUTPUT_DIR="${OUTPUT_DIR:-./data/genres}"
SLEEP_SEC="${SLEEP_SEC:-0.1}"
FLOOR_IDS=(${FLOOR_IDS:-43 44})
BASE_URL="https://api.dmm.com/affiliate/v3/GenreSearch"

# API認証情報の確認
if [ -z "$API_ID" ] || [ -z "$AFFILIATE_ID" ]; then
  echo "エラー: API_ID または AFFILIATE_ID が設定されていません" >&2
  echo "環境変数 DMM_API_ID と DMM_AFFILIATE_ID を設定するか、.env.local ファイルに設定してください" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# 五十音（デフォルト）
INITIALS=(あ い う え お か き く け こ が ぎ ぐ げ ご さ し す せ そ ざ じ ず ぜ ぞ た ち つ て と だ ぢ づ で ど な に ぬ ね の は ひ ふ へ ほ ば び ぶ べ ぼ ぱ ぴ ぷ ぺ ぽ ま み む め も や ゆ よ ら り る れ ろ わ)

fetch_page() {
  local initial="$1" hits="$2" offset="$3" floor_id="$4"

  curl -sS --retry 3 --retry-delay 1 --get \
    --data-urlencode "api_id=${API_ID}" \
    --data-urlencode "affiliate_id=${AFFILIATE_ID}" \
    --data-urlencode "initial=${initial}" \
    --data-urlencode "hits=${hits}" \
    --data-urlencode "offset=${offset}" \
    --data-urlencode "floor_id=${floor_id}" \
    --data-urlencode "output=json" \
    "$BASE_URL"
}

TMP_COMBINED=$(mktemp)
> "$TMP_COMBINED"

for floor_id in "${FLOOR_IDS[@]}"; do
  echo "==== FLOOR_ID: ${floor_id} ====" >&2
  
  for initial in "${INITIALS[@]}"; do
    echo "  INITIAL: ${initial}" >&2

    probe=$(fetch_page "$initial" 1 1 "$floor_id")
    total=$(jq -r '.result.total_count // 0' <<<"$probe")
    if ! [[ "$total" =~ ^[0-9]+$ ]]; then total=0; fi

    if [ "$total" -eq 0 ]; then
      continue
    fi

    pages=$(( (total + HITS - 1) / HITS ))
    fetched=0

    # Initialize progress bar for this initial
    percent=0
    bar_width=20
    filled=0
    empty=$((bar_width - filled))
    bar=$(printf '%0.s#' $(seq 1 $filled))$(printf '%0.s.' $(seq 1 $empty))
    printf "\r  [%s] %3d%% (INITIAL=%s %d/%d page %d/%d)" "$bar" "$percent" "$initial" "$fetched" "$total" 0 "$pages" >&2

    for ((p=1; p<=pages; p++)); do
      offset=$(( (p - 1) * HITS + 1 ))
      json=$(fetch_page "$initial" "$HITS" "$offset" "$floor_id")

      # accumulate fetched count for percent
      rc=$(jq -r '.result.result_count // 0' <<<"$json")
      if ! [[ "$rc" =~ ^[0-9]+$ ]]; then rc=0; fi
      fetched=$(( fetched + rc ))

      if (( total > 0 )); then
        percent=$(( fetched * 100 / total ))
        if (( percent > 100 )); then percent=100; fi
      else
        percent=100
      fi

      # update bar
      filled=$(( percent * bar_width / 100 ))
      empty=$(( bar_width - filled ))
      bar=$(printf '%0.s#' $(seq 1 $filled))$(printf '%0.s.' $(seq 1 $empty))
      printf "\r  [%s] %3d%% (INITIAL=%s %d/%d page %d/%d)" "$bar" "$percent" "$initial" "$fetched" "$total" "$p" "$pages" >&2

      # append simplified entries
      jq -c '(.result.genre // [])[] | {genre_id: (.genre_id|tonumber?), genre_name: .name}' <<<"$json" >>"$TMP_COMBINED" || true

      sleep "$SLEEP_SEC"
    done

    # newline after this initial's progress
    printf "\n" >&2
  done
done

# 重複を排除して保存
jq -s 'unique_by(.genre_id)' "$TMP_COMBINED" >"${OUTPUT_DIR}/genres_summary.json"
total_genres=$(jq 'length' "${OUTPUT_DIR}/genres_summary.json")
rm "$TMP_COMBINED"

echo "[DONE] ${total_genres}件のジャンルデータを保存しました: ${OUTPUT_DIR}/genres_summary.json"

