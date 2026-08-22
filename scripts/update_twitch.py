import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode

CLIENT_ID = os.environ["TWITCH_CLIENT_ID"]
CLIENT_SECRET = os.environ["TWITCH_CLIENT_SECRET"]

TWITCH_USER = "nakanoalma"

OUT = Path("data/twitch.json")


def request_json(url, headers=None, data=None):
    req = Request(
        url,
        headers=headers or {},
        method="POST" if data else "GET"
    )

    with urlopen(req, data=data) as response:
        return json.load(response)


# =========================
# アクセストークン取得
# =========================

token_url = "https://id.twitch.tv/oauth2/token"

token_data = urlencode({
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "grant_type": "client_credentials"
}).encode()

token = request_json(
    token_url,
    data=token_data
)

access_token = token["access_token"]


headers = {
    "Client-ID": CLIENT_ID,
    "Authorization": f"Bearer {access_token}"
}


# =========================
# ユーザー情報
# =========================

user_url = (
    "https://api.twitch.tv/helix/users?"
    + urlencode({"login": TWITCH_USER})
)

user_data = request_json(
    user_url,
    headers=headers
)

users = user_data.get("data", [])

if not users:
    raise SystemExit("Twitch user not found")

user_id = users[0]["id"]


# =========================
# 過去の配信を取得
# =========================

videos = []
cursor = None

while True:

    params = {
        "user_id": user_id,
        "type": "archive",
        "first": 100
    }

    if cursor:
        params["after"] = cursor

    url = (
        "https://api.twitch.tv/helix/videos?"
        + urlencode(params)
    )

    data = request_json(
        url,
        headers=headers
    )

    for item in data.get("data", []):

        videos.append({
            "date": item["created_at"][:10],
            "title": item.get("title", ""),
            "type": "TWITCH",
            "platform": "Twitch",
            "game": item.get("game_name", ""),
            "participants": [],
            "url": item.get(
                "url",
                f"https://www.twitch.tv/{TWITCH_USER}"
            ),
            "videoId": item.get("id", ""),
            "thumbnail": item.get("thumbnail_url", "")
        })

    cursor = data.get("pagination", {}).get("cursor")

    if not cursor:
        break


# =========================
# 現在配信中か確認
# =========================

stream_url = (
    "https://api.twitch.tv/helix/streams?"
    + urlencode({"user_id": user_id})
)

stream_data = request_json(
    stream_url,
    headers=headers
)

streams = stream_data.get("data", [])

if streams:

    stream = streams[0]

    videos.insert(0, {
        "date": stream["started_at"][:10],
        "title": stream.get("title", ""),
        "type": "TWITCH",
        "platform": "Twitch",
        "game": stream.get("game_name", ""),
        "participants": [],
        "url": f"https://www.twitch.tv/{TWITCH_USER}",
        "videoId": "",
        "thumbnail": ""
    })


# =========================
# 重複削除
# =========================

unique = {}

for video in videos:

    video_id = video.get("videoId")

    if video_id and video_id not in unique:
        unique[video_id] = video


videos = list(unique.values())


# =========================
# 日付順
# =========================

videos.sort(
    key=lambda x: x["date"],
    reverse=True
)


# =========================
# 保存
# =========================

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
    f"Wrote {len(videos)} Twitch videos to {OUT}"
)
