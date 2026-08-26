let videos = [];
let twitchVideos = [];
let events = [];
let twitcasting = [];

let selectedType = "ALL";
let view = "card";
let showAllVideos = false;
let showAllTwitch = false;

const INITIAL_VIDEO_COUNT = 6;
let calendarDate = new Date();

const $ = s => document.querySelector(s);

const searchEl = $("#search");
const monthEl = $("#month");
const viewEl = $("#view");
const resultsEl = $("#results");
const summaryEl = $("#summary");
const calendarEl = $("#calendar");
const calendarMonthEl = $("#calendarMonth");
const prevMonthEl = $("#prevMonth");
const nextMonthEl = $("#nextMonth");

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function twitchThumbnail(url, width = 640, height = 360) {
  return String(url || "")
    .replace("%{width}", width)
    .replace("%{height}", height);
}

/* =========================
   データ読み込み
========================= */

Promise.all([
  fetch("data/videos.json").then(r => r.json()),
  fetch("data/twitch.json").then(r => r.json()),
  fetch("data/events.json").then(r => r.json()),
  fetch("data/twitcasting.json")
    .then(r => r.json())
    .catch(() => [])
])
.then(([youtubeData, twitchData, eventData, castData]) => {

  videos = youtubeData.sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  twitchVideos = twitchData.sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  events = eventData;
  twitcasting = castData;

  buildMonths();
  render();
  renderTwitch();
  renderEvents();
  renderCalendar();

})
.catch(error => {
  console.error("データ読み込みエラー:", error);
});


/* =========================
   月選択
========================= */

function buildMonths() {

  const months = [
    ...new Set(
      videos.map(v => v.date.slice(0, 7))
    )
  ];

  monthEl.innerHTML =
    '<option value="ALL">すべて</option>' +
    months.map(m =>
      `<option value="${m}">
        ${m.replace("-", "年")}月
      </option>`
    ).join("");
}


/* =========================
   YouTube一覧
========================= */

function render() {

  const q =
    searchEl.value.trim().toLowerCase();

  const month =
    monthEl.value;

  const filtered =
    videos.filter(v => {

      const text = [
        v.title,
        v.game,
        ...(v.participants || [])
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!q || text.includes(q)) &&
        (
          selectedType === "ALL" ||
          v.type === selectedType
        ) &&
        (
          month === "ALL" ||
          v.date.startsWith(month)
        )
      );
    });

  summaryEl.textContent =
    `${filtered.length}件表示中`;

  const list =
    showAllVideos
      ? filtered
      : filtered.slice(0, INITIAL_VIDEO_COUNT);

  if (!filtered.length) {
    resultsEl.innerHTML =
      '<div class="empty">条件に一致するデータがありません。</div>';
    return;
  }


  /* 表 */

  if (view === "table") {

    resultsEl.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>日付</th>
            <th>タイトル</th>
            <th>種類</th>
            <th>ゲーム</th>
          </tr>
        </thead>

        <tbody>
          ${list.map(v => `
            <tr>
              <td>${v.date}</td>

              <td>
                <a
                  href="${v.url}"
                  target="_blank"
                  rel="noopener"
                >
                  ${escapeHtml(v.title)}
                </a>
              </td>

              <td>${escapeHtml(v.type)}</td>

              <td>${escapeHtml(v.game || "")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      ${moreButton(
        filtered.length,
        showAllVideos,
        "youtube"
      )}
    `;

    return;
  }


  /* カード */

  resultsEl.innerHTML = `
    <div class="grid">

      ${list.map(v => `

        <article class="card">

          <a
            href="${v.url}"
            target="_blank"
            rel="noopener"
            class="thumbnail-link"
          >
            <img
              class="thumbnail"
              src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg"
              alt=""
            >
          </a>

          ${
            v.type === "LIVE" && v.isLive
              ? '<div class="live-badge">🔴 NOW LIVE</div>'
              : ""
          }

          <div class="date">
            ${v.date}
          </div>

          <h2>
            ${escapeHtml(v.title)}
          </h2>

          <div class="meta">

            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
            >
              YouTubeで見る →
            </a>

            ${
              v.game
                ? `
                  <span class="tag">
                    ${escapeHtml(v.game)}
                  </span>
                `
                : ""
            }

            ${(v.participants || [])
              .map(p => `
                <span class="tag">
                  ${escapeHtml(p)}
                </span>
              `)
              .join("")}

          </div>

        </article>

      `).join("")}

    </div>

    ${moreButton(
      filtered.length,
      showAllVideos,
      "youtube"
    )}
  `;
}


/* =========================
   Twitch一覧
========================= */

function renderTwitch() {

  const el =
    $("#twitchResults");

  if (!el) return;

  if (!twitchVideos.length) {

    el.innerHTML =
      '<div class="empty">Twitchの配信データがありません。</div>';

    return;
  }

  const list =
    showAllTwitch
      ? twitchVideos
      : twitchVideos.slice(
          0,
          INITIAL_VIDEO_COUNT
        );

  el.innerHTML = `
    <div class="grid">

      ${list.map(v => `

        <article class="card">

          <a
            href="${v.url}"
            target="_blank"
            rel="noopener"
            class="thumbnail-link"
          >

            <img
              class="thumbnail"
              src="${twitchThumbnail(
                v.thumbnail
              )}"
              alt=""
            >

          </a>

          <div class="date">
            ${v.date}
          </div>

          <h2>
            ${escapeHtml(v.title)}
          </h2>

          <div class="meta">

            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
            >
              Twitchで見る →
            </a>

            <span class="tag">
              👾 Twitch
            </span>

            ${
              v.game
                ? `
                  <span class="tag">
                    ${escapeHtml(v.game)}
                  </span>
                `
                : ""
            }

          </div>

        </article>

      `).join("")}

    </div>

    ${moreButton(
      twitchVideos.length,
      showAllTwitch,
      "twitch"
    )}
  `;
}


/* =========================
   もっと見る
========================= */

function moreButton(
  length,
  showAll,
  type
) {

  if (length <= INITIAL_VIDEO_COUNT) {
    return "";
  }

  return `
    <button
      class="show-more-btn"
      data-more="${type}"
    >
      ${
        showAll
          ? "− 閉じる"
          : "＋ もっと見る"
      }
    </button>
  `;
}


/* =========================
   カレンダー
========================= */

function renderCalendar() {

  if (!calendarEl) return;

  const year =
    calendarDate.getFullYear();

  const month =
    calendarDate.getMonth();

  calendarMonthEl.textContent =
    `${year}年${month + 1}月`;

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();

  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();

  let html = "";


  /* 前月の空白 */

  for (
    let i = 0;
    i < firstDay;
    i++
  ) {

    html += `
      <div class="calendar-day empty-day"></div>
    `;
  }


  /* 日付 */

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const dayVideos =
      videos.filter(
        v => v.date === date
      );

    const dayTwitch =
      twitchVideos.filter(
        v => v.date === date
      );

const dayCast =
  twitcasting.filter(t =>
    String(t.date || "").slice(0, 10) === date
  );


    html += `
      <div class="calendar-day">

        <div class="calendar-date">
          ${day}
        </div>

        <div class="calendar-items">

          <!-- YouTube -->

          ${dayVideos.map(v => `

            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
              class="calendar-item ${getTypeClass(v.type)}"
              title="${escapeHtml(v.title)}"
            >

              <img
                src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg"
                alt=""
              >

              <span>
                ${getTypeLabel(v.type)}
              </span>

            </a>

          `).join("")}


          <!-- Twitch -->

          ${dayTwitch.map(v => `

            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
              class="calendar-item calendar-twitch"
              title="${escapeHtml(v.title)}"
            >

              <img
                src="${twitchThumbnail(
                  v.thumbnail,
                  320,
                  180
                )}"
                alt=""
              >

              <span>
                👾 Twitch
              </span>

            </a>

          `).join("")}


          <!-- ツイキャス -->

${dayCast.map(t => `
  <a
    href="${t.url || "#"}"
    target="_blank"
    rel="noopener"
    class="calendar-item calendar-twitcasting"
    title="${escapeHtml(t.title || "ツイキャス")}"
  >
    <span>
      🎙️ ツイキャス
    </span>
  </a>
`).join("")}
        </div>

      </div>
    `;
  }

  calendarEl.innerHTML =
    html;
}


/* =========================
   カレンダー表示
========================= */

function getTypeClass(type) {

  if (type === "LIVE") {
    return "calendar-live";
  }

  if (type === "SHORT") {
    return "calendar-short";
  }

  if (type === "TWITCH") {
    return "calendar-twitch";
  }

  return "calendar-video";
}


function getTypeLabel(type) {

  if (type === "LIVE") {
    return "配信";
  }

  if (type === "SHORT") {
    return "SHORT";
  }

  if (type === "TWITCH") {
    return "Twitch";
  }

  return "動画";
}


/* =========================
   カレンダー操作
========================= */

prevMonthEl?.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() - 1
    );

    renderCalendar();
  }
);


nextMonthEl?.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() + 1
    );

    renderCalendar();
  }
);


/* =========================
   検索
========================= */

searchEl?.addEventListener(
  "input",
  render
);


monthEl?.addEventListener(
  "change",
  render
);


/* =========================
   カード・表
========================= */

viewEl?.addEventListener(
  "change",
  e => {

    view =
      e.target.value;

    render();
  }
);


/* =========================
   LIVE・動画・SHORT
========================= */

document
  .querySelectorAll(".chip")
  .forEach(btn => {

    btn.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".chip")
          .forEach(b =>
            b.classList.remove("active")
          );

        btn.classList.add("active");

        selectedType =
          btn.dataset.type;

        render();
      }
    );

  });


/* =========================
   もっと見るボタン
========================= */

document.addEventListener(
  "click",
  e => {

    const type =
      e.target.dataset.more;

    if (!type) return;

    if (type === "twitch") {

      showAllTwitch =
        !showAllTwitch;

      renderTwitch();

    } else {

      showAllVideos =
        !showAllVideos;

      render();
    }

  }
);


/* =========================
   イベント情報
========================= */

function renderEvents() {

  const el =
    $("#events");

  if (!el) return;

  if (!events.length) {

    el.innerHTML =
      '<div class="events-empty">現在お知らせするイベントはありません。</div>';

    return;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const sorted =
    [...events].sort(
      (a, b) =>
        new Date(a.startDate) -
        new Date(b.startDate)
    );

  el.innerHTML =
    sorted.map(event => {

      const start =
        new Date(event.startDate);

      const end =
        new Date(event.endDate);

      start.setHours(
        0, 0, 0, 0
      );

      end.setHours(
        23, 59, 59, 999
      );


      let status;
      let statusClass;

      if (today < start) {

        status = "開催予定";
        statusClass = "status-upcoming";

      } else if (today <= end) {

        status = "開催中";
        statusClass = "status-now";

      } else {

        status = "終了";
        statusClass = "status-past";
      }


      return `
        <article
          class="event-card ${
            statusClass === "status-past"
              ? "event-past"
              : ""
          }"
        >

          <div class="event-status ${statusClass}">
            ${status}
          </div>

          <div class="event-date">
            📅 ${formatEventDate(event.startDate)}
            〜
            ${formatEventDate(event.endDate)}
          </div>

          <h3>
            ${escapeHtml(event.title)}
          </h3>

          ${
            event.place
              ? `
                <div class="event-place">
                  📍 ${escapeHtml(event.place)}
                </div>
              `
              : ""
          }

          ${
            event.description
              ? `
                <p>
                  ${escapeHtml(event.description)}
                </p>
              `
              : ""
          }

          ${
            event.url
              ? `
                <a
                  href="${event.url}"
                  target="_blank"
                  rel="noopener"
                >
                  詳細を見る →
                </a>
              `
              : ""
          }

        </article>
      `;

    }).join("");
}


/* =========================
   イベント日付
========================= */

function formatEventDate(
  dateString
) {

  const date =
    new Date(dateString);

  return `
    ${date.getFullYear()}年
    ${date.getMonth() + 1}月
    ${date.getDate()}日
  `;
}
