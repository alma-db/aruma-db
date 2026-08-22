let videos = [];
let events = [];

let selectedType = "ALL";
let view = "card";
let showAllVideos = false;
const INITIAL_VIDEO_COUNT = 6;
let calendarDate = new Date();

const searchEl = document.querySelector("#search");
const monthEl = document.querySelector("#month");
const viewEl = document.querySelector("#view");

const resultsEl = document.querySelector("#results");
const summaryEl = document.querySelector("#summary");

const calendarEl = document.querySelector("#calendar");
const calendarMonthEl = document.querySelector("#calendarMonth");

const prevMonthEl = document.querySelector("#prevMonth");
const nextMonthEl = document.querySelector("#nextMonth");


/* =========================
   データ読み込み
========================= */

fetch("data/events.json")
  .then(r => r.json())
  .then(data => {
    events = data;
    renderEvents();
  });


fetch("data/videos.json")
  .then(r => r.json())
  .then(data => {

    videos = data.sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    buildMonths();

    render();

    renderCalendar();
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

    months
      .map(
        m =>
          `<option value="${m}">
            ${m.replace("-", "年")}月
          </option>`
      )
      .join("");
}


/* =========================
   動画一覧
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


      return (
        okQ &&
        okType &&
        okMonth
      );
    });


  summaryEl.textContent =
    `${filtered.length}件表示中`;
const displayedVideos = showAllVideos
  ? filtered
  : filtered.slice(0, INITIAL_VIDEO_COUNT);

  if (!filtered.length) {

    resultsEl.innerHTML =
      '<div class="empty">条件に一致するデータがありません。</div>';

    return;
  }


  /* =========================
     表表示
  ========================= */

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

          ${displayedVideos
  .map(
    v => `

                <tr>

                  <td>
                    ${v.date}
                  </td>

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
                    ${escapeHtml(v.game)}
                  </td>

                </tr>

              `
            )
            .join("")}

        </tbody>

      </table>

    `;

    return;
  }


  /* =========================
     カード表示
  ========================= */

  resultsEl.innerHTML = `

    <div class="grid">

      ${filtered
        .map(
          v => `

            <article class="card">

              <!-- サムネイル -->

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


              <!-- LIVE表示 -->

              ${
                v.type === "LIVE"
                  ? '<div class="live-badge">🔴 NOW LIVE</div>'
                  : ""
              }


              <!-- 日付 -->

              <div class="date">
                ${v.date}
              </div>


              <!-- タイトル -->

              <h2>
                ${escapeHtml(v.title)}
              </h2>


              <!-- タグ -->

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
                  .map(
                    p =>
                      `
                        <span class="tag">
                          ${escapeHtml(p)}
                        </span>
                      `
                  )
                  .join("")}

              </div>


              <!-- YouTube -->

              <a
                href="${v.url}"
                target="_blank"
                rel="noopener"
              >
                YouTubeで見る →
              </a>

            </article>

          `
        )
        .join("")}

    </div>

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


    html += `

      <div class="calendar-day">

        <div class="calendar-date">
          ${day}
        </div>

        <div class="calendar-items">

          ${dayVideos
            .map(
              v => `

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

              `
            )
            .join("")}

        </div>

      </div>

    `;
  }


  calendarEl.innerHTML =
    html;
}


/* =========================
   カレンダーの色
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


/* =========================
   カレンダーの表示名
========================= */

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

  return String(s).replace(
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
   カレンダー 前月
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


/* =========================
   カレンダー 次月
========================= */

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
   検索
========================= */

searchEl.addEventListener(
  "input",
  render
);


/* =========================
   月選択
========================= */

monthEl.addEventListener(
  "change",
  render
);


/* =========================
   カード・表
========================= */

viewEl.addEventListener(
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
            b.classList.remove(
              "active"
            )
          );


        btn.classList.add(
          "active"
        );


        selectedType =
          btn.dataset.type;


        render();
      }
    );

  });


/* =========================
   イベント情報
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

  today.setHours(
    0,
    0,
    0,
    0
  );


  const sortedEvents =
    [...events].sort(
      (a, b) => {

        const startA =
          new Date(a.startDate);

        const startB =
          new Date(b.startDate);

        return startA - startB;
      }
    );


  eventsEl.innerHTML =
    sortedEvents
      .map(event => {

        const startDate =
          new Date(
            event.startDate
          );

        const endDate =
          new Date(
            event.endDate
          );


        startDate.setHours(
          0,
          0,
          0,
          0
        );

        endDate.setHours(
          23,
          59,
          59,
          999
        );


        let status;
        let statusClass;


        if (today < startDate) {

          status =
            "開催予定";

          statusClass =
            "status-upcoming";

        } else if (
          today <= endDate
        ) {

          status =
            "開催中";

          statusClass =
            "status-now";

        } else {

          status =
            "終了";

          statusClass =
            "status-past";
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
              ${formatEventDate(
                event.startDate
              )}

              〜

              ${formatEventDate(
                event.endDate
              )}

            </div>


            <h3>
              ${escapeHtml(
                event.title
              )}
            </h3>


            ${
              event.place
                ? `
                  <div class="event-place">
                    📍
                    ${escapeHtml(
                      event.place
                    )}
                  </div>
                `
                : ""
            }


            ${
              event.description
                ? `
                  <p>
                    ${escapeHtml(
                      event.description
                    )}
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
      })
      .join("");
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
