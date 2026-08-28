```js
let videos = [], twitchVideos = [], events = [], twicas = [];
let selectedType = "ALL", view = "card";
let showAllVideos = false, showAllTwitch = false;
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

const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[c]
);

const twitchThumb = (url,w=640,h=360) =>
  String(url||"").replace("%{width}",w).replace("%{height}",h);


/* データ読み込み */
Promise.all([
  fetch("data/videos.json").then(r=>r.json()),
  fetch("data/twitch.json").then(r=>r.json()),
  fetch("data/events.json").then(r=>r.json()),
  fetch("data/twicas.json").then(r=>r.json())
])
.then(([v,t,e,c]) => {
  videos = v.sort((a,b)=>b.date.localeCompare(a.date));
  twitchVideos = t.sort((a,b)=>b.date.localeCompare(a.date));
  events = e;
  twicas = c;
  buildMonths();
  render();
  renderTwitch();
  renderEvents();
  renderCalendar();
})
.catch(e => console.error("データ読み込みエラー:",e));


/* 月 */
function buildMonths() {
  const months = [...new Set(videos.map(v=>v.date.slice(0,7)))];
  monthEl.innerHTML =
    '<option value="ALL">すべて</option>' +
    months.map(m=>`<option value="${m}">${m.replace("-","年")}月</option>`).join("");
}


/* YouTube */
function render() {
  const q = searchEl.value.trim().toLowerCase();
  const month = monthEl.value;

  const list = videos.filter(v => {
    const text = [v.title,v.game,...(v.participants||[])].join(" ").toLowerCase();
    return (!q||text.includes(q)) &&
      (selectedType==="ALL"||v.type===selectedType) &&
      (month==="ALL"||v.date.startsWith(month));
  });

  summaryEl.textContent = `${list.length}件表示中`;

  const show = showAllVideos ? list : list.slice(0,INITIAL_VIDEO_COUNT);

  if (!list.length) {
    resultsEl.innerHTML = '<div class="empty">条件に一致するデータがありません。</div>';
    return;
  }

  if (view==="table") {
    resultsEl.innerHTML = `
      <table>
        <thead><tr><th>日付</th><th>タイトル</th><th>種類</th><th>ゲーム</th></tr></thead>
        <tbody>${show.map(v=>`
          <tr>
            <td>${v.date}</td>
            <td><a href="${v.url}" target="_blank">${esc(v.title)}</a></td>
            <td>${esc(v.type)}</td>
            <td>${esc(v.game||"")}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      ${moreButton(list.length,showAllVideos,"youtube")}`;
    return;
  }

  resultsEl.innerHTML = `
    <div class="grid">${show.map(v=>`
      <article class="card">
        <a href="${v.url}" target="_blank" class="thumbnail-link">
          <img class="thumbnail" src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg">
        </a>
        ${v.type==="LIVE"&&v.isLive?'<div class="live-badge">🔴 NOW LIVE</div>':""}
        <div class="date">${v.date}</div>
        <h2>${esc(v.title)}</h2>
        <div class="meta">
          <a href="${v.url}" target="_blank">YouTubeで見る →</a>
          ${v.game?`<span class="tag">${esc(v.game)}</span>`:""}
          ${(v.participants||[]).map(p=>`<span class="tag">${esc(p)}</span>`).join("")}
        </div>
      </article>`).join("")}</div>
    ${moreButton(list.length,showAllVideos,"youtube")}`;
}


/* Twitch */
function renderTwitch() {
  const el = $("#twitchResults");
  if (!el) return;

  const show = showAllTwitch ? twitchVideos : twitchVideos.slice(0,INITIAL_VIDEO_COUNT);

  if (!twitchVideos.length) {
    el.innerHTML = '<div class="empty">Twitchの配信データがありません。</div>';
    return;
  }

  el.innerHTML = `
    <div class="grid">${show.map(v=>`
      <article class="card">
        <a href="${v.url}" target="_blank" class="thumbnail-link">
          <img class="thumbnail" src="${twitchThumb(v.thumbnail)}">
        </a>
        <div class="date">${v.date}</div>
        <h2>${esc(v.title)}</h2>
        <div class="meta">
          <a href="${v.url}" target="_blank">Twitchで見る →</a>
          <span class="tag">Twitch</span>
          ${v.game?`<span class="tag">${esc(v.game)}</span>`:""}
        </div>
      </article>`).join("")}</div>
    ${moreButton(twitchVideos.length,showAllTwitch,"twitch")}`;
}


/* もっと見る */
function moreButton(n,all,type) {
  if(n<=INITIAL_VIDEO_COUNT) return "";
  return `<button class="show-more-btn" data-more="${type}">
    ${all?"− 閉じる":"＋ もっと見る"}
  </button>`;
}


/* カレンダー */
function renderCalendar() {
  if (!calendarEl) return;

  const y = calendarDate.getFullYear();
  const m = calendarDate.getMonth();
  calendarMonthEl.textContent = `${y}年${m+1}月`;

  const first = new Date(y,m,1).getDay();
  const days = new Date(y,m+1,0).getDate();

  let html = "";

  for(let i=0;i<first;i++)
    html += '<div class="calendar-day empty-day"></div>';

  for(let d=1;d<=days;d++) {
    const date = `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    const dayVideos = videos.filter(v=>v.date===date);
    const dayTwitch = twitchVideos.filter(v=>v.date===date);
    const dayTwicas = twicas.filter(v=>v.date===date);

    html += `
      <div class="calendar-day">
        <div class="calendar-date">${d}</div>
        <div class="calendar-items">

          ${dayVideos.map(v=>`
            <a href="${v.url}" target="_blank"
              class="calendar-item ${getTypeClass(v.type)}"
              title="${esc(v.title)}">
              <img src="https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg">
              <span>${getTypeLabel(v.type)}</span>
            </a>`).join("")}

          ${dayTwitch.map(v=>`
            <a href="${v.url}" target="_blank"
              class="calendar-item calendar-twitch"
              title="${esc(v.title)}">
              <img src="${twitchThumb(v.thumbnail,320,180)}">
              <span>Twitch</span>
            </a>`).join("")}

          ${dayTwicas.map(v=>`
            <div class="calendar-twitcasting" title="${esc(v.title||"ツイキャス")}">
              🎙️ ツイキャス
            </div>`).join("")}

        </div>
      </div>`;
  }

  calendarEl.innerHTML = html;
}


function getTypeClass(type) {
  return type==="LIVE" ? "calendar-live" :
         type==="SHORT" ? "calendar-short" :
         "calendar-video";
}

function getTypeLabel(type) {
  return type==="LIVE" ? "配信" :
         type==="SHORT" ? "SHORT" :
         "動画";
}


/* カレンダー操作 */
$("#prevMonth")?.addEventListener("click",()=>{
  calendarDate.setMonth(calendarDate.getMonth()-1);
  renderCalendar();
});

$("#nextMonth")?.addEventListener("click",()=>{
  calendarDate.setMonth(calendarDate.getMonth()+1);
  renderCalendar();
});


/* 検索・表示 */
searchEl?.addEventListener("input",render);
monthEl?.addEventListener("change",render);

viewEl?.addEventListener("change",e=>{
  view=e.target.value;
  render();
});


/* チップ */
document.querySelectorAll(".chip").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    selectedType=btn.dataset.type;
    render();
  });
});


/* もっと見る */
document.addEventListener("click",e=>{
  const type=e.target.dataset.more;
  if(!type) return;

  if(type==="twitch") {
    showAllTwitch=!showAllTwitch;
    renderTwitch();
  } else {
    showAllVideos=!showAllVideos;
    render();
  }
});


/* イベント */
function renderEvents() {
  const el=$("#events");
  if(!el) return;

  if(!events.length) {
    el.innerHTML='<div class="events-empty">現在お知らせするイベントはありません。</div>';
    return;
  }

  const today=new Date();
  today.setHours(0,0,0,0);

  el.innerHTML=[...events]
    .sort((a,b)=>new Date(a.startDate)-new Date(b.startDate))
    .map(e=>{
      const start=new Date(e.startDate);
      const end=new Date(e.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      const past=today>end;
      const now=!past&&today>=start;
      const status=now?"開催中":past?"終了":"開催予定";
      const cls=now?"status-now":past?"status-past":"status-upcoming";

      return `
        <article class="event-card ${past?"event-past":""}">
          <div class="event-status ${cls}">${status}</div>
          <div class="event-date">📅 ${formatEventDate(e.startDate)} 〜 ${formatEventDate(e.endDate)}</div>
          <h3>${esc(e.title)}</h3>
          ${e.place?`<div class="event-place">📍 ${esc(e.place)}</div>`:""}
          ${e.description?`<p>${esc(e.description)}</p>`:""}
          ${e.url?`<a href="${e.url}" target="_blank">詳細を見る →</a>`:""}
        </article>`;
    }).join("");
}


function formatEventDate(s) {
  const d=new Date(s);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}
```
