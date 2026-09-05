// ---------------------------------------------------------
// 데이터는 이제 이 파일 안이 아니라 data.json에서 불러옵니다.
// 데이터 담당자가 data.json 내용을 최신 MCAD/ADMIRAL 정규화
// 데이터로 교체하면, 이 사이트는 다음 새로고침(또는 배포)때
// 자동으로 새 내용을 반영합니다.
// ---------------------------------------------------------

const SEVERITY_LABEL = { high:"높음", medium:"중간", low:"낮음" };

let INCIDENTS = [];
let filters = { asset:null, country:null, severity:null };
let selectedId = null;

async function loadData(){
  const main = document.getElementById('incident-list');
  try{
    // 캐시를 타지 않도록 매번 최신 data.json을 가져옵니다.
    const res = await fetch('data.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('data.json을 불러오지 못했습니다 (' + res.status + ')');
    INCIDENTS = await res.json();
    renderAll();
  }catch(err){
    main.innerHTML = `<div class="error">데이터를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`;
  }
}

function uniqueCounts(key){
  const counts = {};
  INCIDENTS.forEach(i => counts[i[key]] = (counts[i[key]]||0) + 1);
  return counts;
}

function renderFilters(){
  renderFilterGroup('filter-asset', 'asset', uniqueCounts('asset'));
  renderFilterGroup('filter-country', 'country', uniqueCounts('country'));
  renderFilterGroup('filter-severity', 'severity', uniqueCounts('severity'), SEVERITY_LABEL);
}

function renderFilterGroup(elId, key, counts, labelMap){
  const el = document.getElementById(elId);
  el.innerHTML = '';
  Object.entries(counts).forEach(([value, count]) => {
    const chip = document.createElement('div');
    chip.className = 'chip' + (filters[key] === value ? ' active' : '');
    chip.innerHTML = `<span>${labelMap ? labelMap[value] : value}</span><span class="count">${count}</span>`;
    chip.onclick = () => {
      filters[key] = filters[key] === value ? null : value;
      renderAll();
    };
    el.appendChild(chip);
  });
}

function resetFilters(){
  filters = { asset:null, country:null, severity:null };
  renderAll();
}

function filteredIncidents(){
  return INCIDENTS.filter(i =>
    (!filters.asset || i.asset === filters.asset) &&
    (!filters.country || i.country === filters.country) &&
    (!filters.severity || i.severity === filters.severity)
  );
}

function renderStats(){
  const el = document.getElementById('stats');
  const total = INCIDENTS.length;
  const byAsset = uniqueCounts('asset');
  const max = Math.max(...Object.values(byAsset));
  const topAssets = Object.entries(byAsset).sort((a,b) => b[1]-a[1]).slice(0,3);

  el.innerHTML = `
    <div class="stat">
      <div class="num">${total}</div>
      <div class="label">전체 사고 건수</div>
    </div>
    <div class="stat" style="flex:2">
      <div class="label" style="margin-bottom:8px;">자산유형별 상위 3</div>
      ${topAssets.map(([name,count]) => `
        <div class="bar-row">
          <span style="width:150px; color:var(--text);">${name}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(count/max*100)}%"></div></div>
          <span style="width:16px; text-align:right;">${count}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderList(){
  const list = filteredIncidents().sort((a,b) => b.date.localeCompare(a.date));
  document.getElementById('list-count').textContent = `${list.length}건 표시 중`;
  const el = document.getElementById('incident-list');
  el.innerHTML = '';
  list.forEach(i => {
    const row = document.createElement('div');
    row.className = 'incident' + (i.id === selectedId ? ' selected' : '');
    row.innerHTML = `
      <div class="sev-dot" style="background:var(--sev-${i.severity})"></div>
      <div class="asset">${i.asset}</div>
      <div class="title">${i.title}</div>
      <div class="id">${i.id}</div>
      <div class="date">${i.date}</div>
    `;
    row.onclick = () => { selectedId = i.id; renderDetail(); renderList(); };
    el.appendChild(row);
  });
}

function renderDetail(){
  const el = document.getElementById('detail');
  const i = INCIDENTS.find(x => x.id === selectedId);
  if(!i){ el.innerHTML = '<div class="empty">사고를 선택하면<br>상세 정보와 관련 규제가<br>여기에 표시됩니다</div>'; return; }
  el.innerHTML = `
    <div class="id">${i.id}</div>
    <h3>${i.title}</h3>
    <div class="meta-row">
      <span class="tag">${i.asset}</span>
      <span class="tag">${i.country}</span>
      <span class="tag" style="color:var(--sev-${i.severity})">심각도: ${SEVERITY_LABEL[i.severity]}</span>
      <span class="tag">${i.date}</span>
    </div>
    <p class="desc">${i.desc}</p>
    <div class="reg-block">
      <h4>관련 IMO / IACS 통제 항목</h4>
      ${i.regs.map(r => `
        <div class="reg-item">
          <div class="code">${r.code}</div>
          <div class="desc">${r.desc}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderAll(){
  renderFilters();
  renderStats();
  renderList();
  renderDetail();
}

document.addEventListener('DOMContentLoaded', loadData);
