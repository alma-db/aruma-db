let videos = [], twitchVideos = [], events = [], twitcasting = [];
let selectedType = "ALL", view = "card";
let showAllVideos = false, showAllTwitch = false;
const INITIAL_VIDEO_COUNT = 6;
let calendarDate = new Date();

const $ = s => document.querySelector(s);
const searchEl = $("#search"), monthEl = $("#month"), viewEl = $("#view");
const resultsEl = $("#results"), summaryEl = $("#summary");
const calendarEl = $("#calendar"), calendarMonthEl = $("#calendarMonth");
const prevMonthEl = $("#prevMonth"), nextMonthEl = $("#nextMonth");

const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]
);

/* データ読み込み */
Promise.all([
  fetch("data/videos.json").then(r => r.json()),
  fetch("data/twitch.json").then(r => r.json()),
  fetch("data/events.json").then(r => r.json()),
  fetch("data/twitcasting.json").then(r => r.json()).catch(() => [])
]).then(([y,t,e,tc]) => {
  videos = y.sort((a,b) => b.date.localeCompare(a.date));
  twitchVideos = t.sort((a,b) => b.date.localeCompare(a.date));
  events = e;
  twitcasting = tc;

  buildMonths();
  render();
  renderTwitch();
  renderEvents();
  renderCalendar();
}).catch(console.error);

/* 月 */
function buildMonths() {
  const months = [...new Set(videos.map(v => v.date.slice(0,7)))];
  monthEl.innerHTML = '<option value="ALL">すべて</option>' +
    months.map(m => `<option value="${m}">${m.replace("-", "年")}月</option>`).join("");
}

/* YouTube */
function render() {
  const q = searchEl.value.trim().toLowerCase();
  const month = monthEl.value;

  const filtered = videos.filter(v => {
    const text = [v.title,v.game,...(v.participants || [])].join(" ").toLowerCase();
    return (!q || text.includes(q)) &&
      (selectedType === "ALL" || v.type === selectedType) &&
      (month === "ALL" || v.date.startsWith(month));
  });

  summaryEl.textContent = `${filtered.length}件表示中`;
  const list = showAllVideos ? filtered : filtered.slice(0, INITIAL_VIDEO_COUNT);

  if (!filtered.length) {
    resultsEl.innerHTML = '<div class="empty">条件に一致するデータがありません。</div>';
    return;
  }

  if (view === "table") {
    resultsEl.innerHTML = `
      <table><thead><tr><th>日付</th><th>タイトル</th><th>種類</th><th>ゲーム</th></tr></thead>
      <tbody>${list.map(v => `
        <tr>
          <td>${v.date}</td>
          <td><a href="${v.url}" target="_blank" rel="noopener">${escapeHtml(v.title)}</a></td>
          <td>${escapeHtml(v.type)}</td>
          <td>${escapeHtml(v.game || "")}</td>
        </tr>`).join("")}</tbody></table>
      ${moreButton(filtered.length, showAllVideos)}
    `;
    return;
  }

  resultsEl.innerHTML = `
    <div class="grid">${list.map(v => `
      <article class="card">
        <a href="${v.url}" target="_blank" rel="noopener" class="thumbnail-link">
          <img class="thumbnail"
            src="${v.platform === "Twitch" ? v.thumbnail : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}"
            alt="">
        </a>
        ${v.type === "LIVE" && v.isLive ? '<div class="live-badge">🔴 NOW LIVE</div>' : ""}
        <div class="date">${v.date}</div>
        <h2>${escapeHtml(v.title)}</h2>
        <div class="meta">
          <a href="${v.url}" target="_blank" rel="noopener">
            ${v.platform === "Twitch" ? "Twitchで見る →" : "YouTubeで見る →"}
          </a>
          ${v.game ? `<span class="tag">${escapeHtml(v.game)}</span>` : ""}
          ${(v.participants || []).map(p => `<span class="tag">${escapeHtml(p)}</span>`).join("")}
        </div>
      </article>`).join("")}</div>
    ${moreButton(filtered.length, showAllVideos)}
  `;
}

/* Twitch */
function renderTwitch() {
  const el = $("#twitchResults");
  if (!el) return;

  if (!twitchVideos.length) {
    el.innerHTML = '<div class="empty">Twitchの配信データがありません。</div>';
    return;
  }

  const list = showAllTwitch
    ? twitchVideos
    : twitchVideos.slice(0, INITIAL_VIDEO_COUNT);

  el.innerHTML = `
    <div class="grid">${list.map(v => `
      <article class="card">
        <a href="${v.url}" target="_blank" rel="noopener" class="thumbnail-link">
          <img class="thumbnail" src="${v.thumbnail || ""}" alt="">
        </a>
        <div class="date">${v.date}</div>
        <h2>${escapeHtml(v.title)}</h2>
        <div class="meta">
          <a href="${v.url}" target="_blank" rel="noopener">Twitchで見る →</a>
          <span class="tag">👾 Twitch</span>
          ${v.game ? `<span class="tag">${escapeHtml(v.game)}</span>` : ""}
        </div>
      </article>`).join("")}</div>
    ${moreButton(twitchVideos.length, showAllTwitch, "twitch")}
  `;
}

/* もっと見る */
function moreButton(length, all, type = "youtube") {
  if (length <= INITIAL_VIDEO_COUNT) return "";
  return `<button class="show-more-btn" data-more="${type}">
    ${all ? "− 閉じる" : "＋ もっと見る"}
  </button>`;
}

/* カレンダー */
function renderCalendar() {
  if (!calendarEl) return;

  const y = calendarDate.getFullYear(), m = calendarDate.getMonth();
  calendarMonthEl.textContent = `${y}年${m + 1}月`;

  const first = new Date(y,m,1).getDay();
  const days = new Date(y,m+1,0).getDate();
  let html = "";

  for (let i=0;i<first;i++) html += '<div class="calendar-day empty-day"></div>';

  for (let d=1;d<=days;d++) {
    const date = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
    const dayVideos = videos.filter(v => v.date === date);
    const hasCast = twitcasting.some(t => t.date === date);

    html += `
      <div class="calendar-day">
        <div class="calendar-date">${d}</div>
        <div class="calendar-items">
          ${dayVideos.map(v => `
            <a href="${v.url}" target="_blank" rel="noopener"
              class="calendar-item ${getTypeClass(v.type)}"
              title="${escapeHtml(v.title)}">
              <img src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg" alt="">
              <span>${getTypeLabel(v.type)}</span>
            </a>`).join("")}
          ${hasCast ? '<div class="calendar-twitcasting">🎙️ ツイキャス</div>' : ""}
        </div>
      </div>`;
  }

  calendarEl.innerHTML = html;
}

function getTypeClass(type) {
  return type === "LIVE" ? "calendar-live" :
         type === "SHORT" ? "calendar-short" :
         type === "TWITCH" ? "calendar-twitch" :
         "calendar-video";
}

function getTypeLabel(type) {
  return type === "LIVE" ? "配信" :
         type === "SHORT" ? "SHORT" :
         type === "TWITCH" ? "👾 Twitch" : "動画";
}

/* カレンダー操作 */
prevMonthEl?.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

nextMonthEl?.addEventListener("click", () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

/* 検索・月・表示 */
searchEl?.addEventListener("input", render);
monthEl?.addEventListener("change", render);
viewEl?.addEventListener("change", e => {
  view = e.target.value;
  render();
});

/* 種類ボタン */
document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
    render();
  });
});

/* もっと見る */
document.addEventListener("click", e => {
  const type = e.target.dataset.more;
  if (!type) return;

  if (type === "twitch") {
    showAllTwitch = !showAllTwitch;
    renderTwitch();
  } else {
    showAllVideos = !showAllVideos;
    render();
  }
});

/* イベント */
function renderEvents() {
  const el = $("#events");
  if (!el) return;

  if (!events.length) {
    el.innerHTML = '<div class="events-empty">現在お知らせするイベントはありません。</div>';
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);

  el.innerHTML = [...events]
    .sort((a,b) => new Date(a.startDate) - new Date(b.startDate))
    .map(e => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      const status = today < start ? "開催予定" : today <= end ? "開催中" : "終了";
      const cls = status === "開催予定" ? "status-upcoming" :
                  status === "開催中" ? "status-now" : "status-past";

      return `
        <article class="event-card ${cls === "status-past" ? "event-past" : ""}">
          <div class="event-status ${cls}">${status}</div>
          <div class="event-date">📅 ${formatEventDate(e.startDate)} 〜 ${formatEventDate(e.endDate)}</div>
          <h3>${escapeHtml(e.title)}</h3>
          ${e.place ? `<div class="event-place">📍 ${escapeHtml(e.place)}</div>` : ""}
          ${e.description ? `<p>${escapeHtml(e.description)}</p>` : ""}
          ${e.url ? `<a href="${e.url}" target="_blank" rel="noopener">詳細を見る →</a>` : ""}
        </article>`;
    }).join("");
}

function formatEventDate(s) {
  const d = new Date(s);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
