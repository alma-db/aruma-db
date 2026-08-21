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


# 動画一覧を取得
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

        kind = (
            "SHORT"
            if "#shorts" in low or "shorts" in low
            else "VIDEO"
        )

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


# 配信情報を確認
# YouTube APIでは、終了した配信にも
# liveStreamingDetails.actualStartTime が残る
# ので、過去の配信も「LIVE」として判定できる
video_ids = [
    v["videoId"]
    for v in videos
]


for i in range(0, len(video_ids), 50):

    batch = video_ids[i:i + 50]

    details = api(
        "videos",
        {
            "part": "snippet,liveStreamingDetails",
            "id": ",".join(batch)
        }
    )

    for item in details.get("items", []):

        vid = item["id"]

        streaming = item.get(
            "liveStreamingDetails"
        )

        if not streaming:
            continue

        # 実際に配信された動画
        if streaming.get("actualStartTime"):

            for v in videos:

                if v["videoId"] == vid:

                    # Shortsより配信判定を優先
                    v["type"] = "LIVE"

                    break


# 現在配信中のものを確認
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

    if vid:
        live_ids.add(vid)


# 重複削除
unique = {}

for v in videos:

    vid = v["videoId"]

    if vid not in unique:
        unique[vid] = v


videos = list(unique.values())


# 現在LIVE中のものはLIVE
for v in videos:

    if v["videoId"] in live_ids:
        v["type"] = "LIVE"


# 日付順
videos.sort(
    key=lambda x: x["date"],
    reverse=True
)


# 保存
OUT.parent.mkdir(
    parents=True,
    exist_ok=True
)

OUT.write_text(
    json.dumps(
        videos,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print(
    f"Wrote {len(videos)} videos to {OUT}"
)
