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

token = request_json(token_url, data=token_data)

access_token = token["access_token"]


# =========================
# ユーザー情報取得
# =========================

user_url = (
    "https://api.twitch.tv/helix/users?"
    + urlencode({"login": TWITCH_USER})
)

headers = {
    "Client-ID": CLIENT_ID,
    "Authorization": f"Bearer {access_token}"
}

user_data = request_json(
    user_url,
    headers=headers
)

users = user_data.get("data", [])

if not users:
    raise SystemExit("Twitch user not found")

user_id = users[0]["id"]


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


# =========================
# 保存データ作成
# =========================

result = []

if streams:

    stream = streams[0]

    result.append({
        "date": stream["started_at"][:10],
        "title": stream.get("title", ""),
        "type": "LIVE",
        "platform": "Twitch",
        "game": stream.get("game_name", ""),
        "url": f"https://www.twitch.tv/{TWITCH_USER}",
        "videoId": "",
        "participants": []
    })


# =========================
# 保存
# =========================

OUT.parent.mkdir(
    parents=True,
    exist_ok=True
)

OUT.write_text(
    json.dumps(
        result,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print(
    f"Wrote {len(result)} Twitch stream(s) to {OUT}"
)
