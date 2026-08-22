let videos = [];
let twitchVideos = [];
let events = [];

let selectedType = "ALL";
let view = "card";

let showAllVideos = false;
let showAllTwitch = false;

const INITIAL_COUNT = 6;

let calendarDate = new Date();

const searchEl = document.querySelector("#search");
const monthEl = document.querySelector("#month");
const viewEl = document.querySelector("#view");

const resultsEl = document.querySelector("#results");
const twitchResultsEl = document.querySelector("#twitchResults");
const summaryEl = document.querySelector("#summary");

const calendarEl = document.querySelector("#calendar");
const calendarMonthEl = document.querySelector("#calendarMonth");

const prevMonthEl = document.querySelector("#prevMonth");
const nextMonthEl = document.querySelector("#nextMonth");


/* =========================
   データ読み込み
========================= */

Promise.all([
  fetch("data/videos.json").then(r => r.json()),
  fetch("data/twitch.json").then(r => r.json()),
  fetch("data/events.json").then(r => r.json())
])
.then(([youtubeData, twitchData, eventData]) => {

  videos = youtubeData.sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  twitchVideos = twitchData.sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  events = eventData;

  buildMonths();
  render();
  renderTwitch();
  renderEvents();
  renderCalendar();

});


/* =========================
   月選択
========================= */

function buildMonths() {

  const allVideos = [
    ...videos,
    ...twitchVideos
  ];

  const months = [
    ...new Set(
      allVideos.map(v => v.date.slice(0, 7))
    )
  ];

  monthEl.innerHTML =
    '<option value="ALL">すべて</option>' +
    months
      .sort()
      .reverse()
      .map(
        m =>
          `<option value="${m}">
            ${m.replace("-", "年")}月
          </option>`
      )
      .join("");
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

      const okQ =
        !q || text.includes(q);

      const okType =
        selectedType === "ALL" ||
        v.type === selectedType;

      const okMonth =
        month === "ALL" ||
        v.date.startsWith(month);

      return okQ && okType && okMonth;

    });


  summaryEl.textContent =
    `${filtered.length}件表示中`;


  if (!filtered.length) {

    resultsEl.innerHTML =
      '<div class="empty">条件に一致するデータがありません。</div>';

    return;
  }


  const displayed =
    showAllVideos
      ? filtered
      : filtered.slice(0, INITIAL_COUNT);


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

          ${displayed.map(v => `

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

              <td>
                ${escapeHtml(v.type)}
              </td>

              <td>
                ${escapeHtml(v.game || "")}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    `;

  } else {

    resultsEl.innerHTML = `

      <div class="grid">

        ${displayed.map(v => `

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
              v.type === "LIVE"
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

              <span class="tag">
                ${escapeHtml(v.type)}
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

              ${(v.participants || [])
                .map(p => `
                  <span class="tag">
                    ${escapeHtml(p)}
                  </span>
                `)
                .join("")}

            </div>


            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
            >
              YouTubeで見る →
            </a>

          </article>

        `).join("")}

      </div>

      ${
        filtered.length > INITIAL_COUNT
          ? `
            <button
              id="showMoreBtn"
              class="show-more-btn"
            >
              ${showAllVideos
                ? "− 閉じる"
                : "＋ もっと見る"}
            </button>
          `
          : ""
      }

    `;

  }

}


/* =========================
   Twitch一覧
========================= */

function renderTwitch() {

  if (!twitchResultsEl) return;


  const q =
    searchEl.value.trim().toLowerCase();

  const month =
    monthEl.value;


  const filtered =
    twitchVideos.filter(v => {

      const text = [
        v.title,
        v.game
      ]
      .join(" ")
      .toLowerCase();


      const okQ =
        !q || text.includes(q);


      const okMonth =
        month === "ALL" ||
        v.date.startsWith(month);


      return okQ && okMonth;

    });


  if (!filtered.length) {

    twitchResultsEl.innerHTML =
      '<div class="empty">Twitchの配信はありません。</div>';

    return;
  }


  const displayed =
    showAllTwitch
      ? filtered
      : filtered.slice(0, INITIAL_COUNT);


  twitchResultsEl.innerHTML = `

    <div class="grid">

      ${displayed.map(v => `

        <article class="card twitch-card">

          <a
            href="${v.url}"
            target="_blank"
            rel="noopener"
            class="thumbnail-link"
          >

${
  v.thumbnail
    ? `
      <img
        class="thumbnail"
        src="${v.thumbnail
          .replace("%{width}", "640")
          .replace("%{height}", "360")}"
        alt=""
      >
    `
    : `
      <div class="twitch-placeholder">
        👾 Twitch
      </div>
    `
}

          <div class="date">
            ${v.date}
          </div>


          <h2>
            ${escapeHtml(v.title)}
          </h2>


          <div class="meta">

            <span class="tag twitch-tag">
              🟣 Twitch
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


          <a
            href="${v.url}"
            target="_blank"
            rel="noopener"
          >
            Twitchで見る →
          </a>

        </article>

      `).join("")}

    </div>


    ${
      filtered.length > INITIAL_COUNT
        ? `
          <button
            id="showMoreTwitchBtn"
            class="show-more-btn"
          >
            ${
              showAllTwitch
                ? "− 閉じる"
                : "＋ もっと見る"
            }
          </button>
        `
        : ""
    }

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
    new Date(year, month, 1).getDay();

  const daysInMonth =
    new Date(year, month + 1, 0).getDate();


  let html = "";


  for (let i = 0; i < firstDay; i++) {

    html +=
      `<div class="calendar-day empty-day"></div>`;

  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


    const dayVideos =
      videos.filter(v => v.date === date);

    const dayTwitch =
      twitchVideos.filter(v => v.date === date);


    html += `

      <div class="calendar-day">

        <div class="calendar-date">
          ${day}
        </div>

        <div class="calendar-items">

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


          ${dayTwitch.map(v => `

            <a
              href="${v.url}"
              target="_blank"
              rel="noopener"
              class="calendar-item calendar-twitch"
              title="${escapeHtml(v.title)}"
            >

              ${
                v.thumbnail
                  ? `
                    <img
                      src="${v.thumbnail}"
                      alt=""
                    >
                  `
                  : `
                    <div class="twitch-calendar-placeholder">
                      🟣
                    </div>
                  `
              }

              <span>
                Twitch
              </span>

            </a>

          `).join("")}

        </div>

      </div>

    `;

  }


  calendarEl.innerHTML = html;

}


/* =========================
   カレンダー色
========================= */

function getTypeClass(type) {

  if (type === "LIVE") {
    return "calendar-live";
  }

  if (type === "SHORT") {
    return "calendar-short";
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

  return "動画";

}


/* =========================
   HTMLエスケープ
========================= */

function escapeHtml(s) {

  return String(s || "").replace(
    /[&<>"']/g,
    c =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[c]
  );

}


/* =========================
   カレンダー操作
========================= */

prevMonthEl.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() - 1
    );

    renderCalendar();

  }
);


nextMonthEl.addEventListener(
  "click",
  () => {

    calendarDate.setMonth(
      calendarDate.getMonth() + 1
    );

    renderCalendar();

  }
);


/* =========================
   検索・絞り込み
========================= */

searchEl.addEventListener(
  "input",
  () => {

    render();
    renderTwitch();

  }
);


monthEl.addEventListener(
  "change",
  () => {

    render();
    renderTwitch();

  }
);


viewEl.addEventListener(
  "change",
  e => {

    view = e.target.value;

    render();

  }
);


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
        renderTwitch();

      }
    );

  });


/* =========================
   もっと見る
========================= */

document.addEventListener(
  "click",
  e => {

    if (e.target.id === "showMoreBtn") {

      showAllVideos =
        !showAllVideos;

      render();

    }


    if (
      e.target.id ===
      "showMoreTwitchBtn"
    ) {

      showAllTwitch =
        !showAllTwitch;

      renderTwitch();

    }

  }
);


/* =========================
   イベント
========================= */

function renderEvents() {

  const eventsEl =
    document.querySelector("#events");

  if (!eventsEl) return;


  if (!events.length) {

    eventsEl.innerHTML =
      '<div class="events-empty">現在お知らせするイベントはありません。</div>';

    return;

  }


  const today =
    new Date();

  today.setHours(0, 0, 0, 0);


  const sortedEvents =
    [...events].sort(
      (a, b) =>
        new Date(a.startDate) -
        new Date(b.startDate)
    );


  eventsEl.innerHTML =
    sortedEvents.map(event => {

      const startDate =
        new Date(event.startDate);

      const endDate =
        new Date(event.endDate);

      startDate.setHours(
        0, 0, 0, 0
      );

      endDate.setHours(
        23, 59, 59, 999
      );


      let status;
      let statusClass;


      if (today < startDate) {

        status = "開催予定";
        statusClass = "status-upcoming";

      } else if (
        today <= endDate
      ) {

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

          <div
            class="event-status ${statusClass}"
          >
            ${status}
          </div>


          <div class="event-date">
            📅
            ${formatEventDate(event.startDate)}
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
                  📍
                  ${escapeHtml(event.place)}
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


function formatEventDate(dateString) {

  const date =
    new Date(dateString);

  return `${date.getFullYear()}年${
    date.getMonth() + 1
  }月${date.getDate()}日`;

}
