let videos=[];
let selectedType="ALL";
let view="card";

const searchEl=document.querySelector("#search");
const monthEl=document.querySelector("#month");
const viewEl=document.querySelector("#view");
const resultsEl=document.querySelector("#results");
const summaryEl=document.querySelector("#summary");

fetch("data/videos.json")
  .then(r=>r.json())
  .then(data=>{
    videos=data.sort((a,b)=>b.date.localeCompare(a.date));
    buildMonths();
    render();
  });

function buildMonths(){
  const months=[...new Set(videos.map(v=>v.date.slice(0,7)))];
  monthEl.innerHTML='<option value="ALL">すべて</option>'+
    months.map(m=>`<option value="${m}">${m.replace("-","年")}月</option>`).join("");
}

function render(){
  const q=searchEl.value.trim().toLowerCase();
  const month=monthEl.value;
  const filtered=videos.filter(v=>{
    const text=[v.title,v.game,...(v.participants||[])].join(" ").toLowerCase();
    const okQ=!q||text.includes(q);
    const okType=selectedType==="ALL"||v.type===selectedType;
    const okMonth=month==="ALL"||v.date.startsWith(month);
    return okQ&&okType&&okMonth;
  });

  summaryEl.textContent=`${filtered.length}件表示中`;

  if(!filtered.length){
    resultsEl.innerHTML='<div class="empty">条件に一致するデータがありません。</div>';
    return;
  }

  if(view==="table"){
    resultsEl.innerHTML=`<table><thead><tr><th>日付</th><th>タイトル</th><th>種類</th><th>ゲーム</th></tr></thead>
      <tbody>${filtered.map(v=>`<tr><td>${v.date}</td><td><a href="${v.url}" target="_blank" rel="noopener">${escapeHtml(v.title)}</a></td><td>${v.type}</td><td>${escapeHtml(v.game)}</td></tr>`).join("")}</tbody></table>`;
  }else{
    resultsEl.innerHTML=`<div class="grid">${filtered.map(v=>`
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

  ${v.type==="LIVE" ? '<div class="live-badge">🔴 NOW LIVE</div>' : ''}

  <div class="date">${v.date}</div>
  <h2>${escapeHtml(v.title)}</h2>
  <div class="date">${v.date}</div>
  <h2>${escapeHtml(v.title)}</h2>
        <div class="meta">
          <span class="tag">${escapeHtml(v.type)}</span>
          <span class="tag">${escapeHtml(v.game)}</span>
          ${(v.participants||[]).map(p=>`<span class="tag">${escapeHtml(p)}</span>`).join("")}
        </div>
        <a href="${v.url}" target="_blank" rel="noopener">YouTubeで見る →</a>
      </article>`).join("")}</div>`;
  }
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

searchEl.addEventListener("input",render);
monthEl.addEventListener("change",render);
viewEl.addEventListener("change",e=>{view=e.target.value;render()});
document.querySelectorAll(".chip").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".chip").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    selectedType=btn.dataset.type;
    render();
  });
});
