import json, os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

API_KEY = os.environ["YOUTUBE_API_KEY"]
CHANNEL_ID = "UCa4UF7FI-86773JqWLJyGqg"
OUT = Path("data/videos.json")


def api(endpoint, params):
    params = dict(params)
    params["key"] = API_KEY

    url = (
        "https://www.googleapis.com/youtube/v3/"
        + endpoint
        + "?"
        + urlencode(params)
    )

    try:
        with urlopen(url) as r:
            return json.load(r)
    except Exception as e:
        print("YouTube API error:", e)
        if hasattr(e, "read"):
            print(e.read().decode("utf-8"))
        raise


# チャンネル情報
channel = api(
    "channels",
    {
        "part": "contentDetails",
        "id": CHANNEL_ID
    }
)

items = channel.get("items", [])

if not items:
    raise SystemExit("Channel not found")

uploads_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]


# 過去の動画を取得
videos = []
token = None

while True:
    params = {
        "part": "snippet,contentDetails",
        "playlistId": uploads_id,
        "maxResults": 50
    }

    if token:
        params["pageToken"] = token

    page = api("playlistItems", params)

    for item in page.get("items", []):
        s = item["snippet"]
        r = item["contentDetails"]

        vid = r.get("videoId")

        if not vid:
            continue

        title = s.get("title", "")
        low = title.lower()

        kind = "SHORT" if "#shorts" in low or "shorts" in low else "VIDEO"

        videos.append({
            "date": s.get("publishedAt", "")[:10],
            "title": title,
            "type": kind,
            "game": "",
            "participants": [],
            "url": f"https://www.youtube.com/watch?v={vid}",
            "videoId": vid
        })

    token = page.get("nextPageToken")

    if not token:
        break


# 現在LIVE中の配信を取得
live_page = api(
    "search",
    {
        "part": "snippet",
        "channelId": CHANNEL_ID,
        "eventType": "live",
        "type": "video",
        "maxResults": 10
    }
)

live_ids = set()

for item in live_page.get("items", []):
    vid = item["id"].get("videoId")

    if not vid:
        continue

    live_ids.add(vid)

    s = item["snippet"]

    videos.append({
        "date": s.get("publishedAt", "")[:10],
        "title": s.get("title", ""),
        "type": "LIVE",
        "game": "",
        "participants": [],
        "url": f"https://www.youtube.com/watch?v={vid}",
        "videoId": vid
    })


# 重複削除
unique = {}

for v in videos:
    vid = v["videoId"]

    # 同じ動画が複数あった場合、
    # 現在LIVE中ならLIVEを優先
    if vid not in unique or vid in live_ids:
        unique[vid] = v

videos = list(unique.values())


# LIVE以外は通常の種類にする
for v in videos:
    if v["videoId"] not in live_ids and v["type"] == "LIVE":
        v["type"] = "VIDEO"


# LIVEを先頭、その後は日付順
videos.sort(
    key=lambda x: (
        x["type"] == "LIVE",
        x["date"]
    ),
    reverse=True
)


# 保存
OUT.parent.mkdir(parents=True, exist_ok=True)

OUT.write_text(
    json.dumps(
        videos,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print(f"Wrote {len(videos)} videos to {OUT}")
