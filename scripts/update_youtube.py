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
    url = "https://www.googleapis.com/youtube/v3/" + endpoint + "?" + urlencode(params)
    try:
        with urlopen(url) as r:
            return json.load(r)
    except Exception as e:
        print("YouTube API error:", e)
        if hasattr(e, "read"):
            print(e.read().decode("utf-8"))
        raise

channel = api("channels", {"part": "contentDetails", "id": CHANNEL_ID})
items = channel.get("items", [])
if not items:
    raise SystemExit("Channel not found")
uploads_id = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

videos, token = [], None
while True:
    params = {"part": "snippet,contentDetails", "playlistId": uploads_id, "maxResults": 50}
    if token:
        params["pageToken"] = token
    page = api("playlistItems", params)
    for item in page.get("items", []):
        s, r = item["snippet"], item["contentDetails"]
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

unique = {v["videoId"]: v for v in videos}
videos = sorted(unique.values(), key=lambda x: x["date"], reverse=True)
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Wrote {len(videos)} videos to {OUT}")
