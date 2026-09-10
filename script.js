// ---------------------------------------------------------
// 데이터는 이제 이 파일 안이 아니라 data.json에서 불러옵니다.
// 데이터 담당자가 data.json 내용을 최신 MCAD/ADMIRAL 정규화
// 데이터로 교체하면, 이 사이트는 다음 새로고침(또는 배포)때
// 자동으로 새 내용을 반영합니다.
// ---------------------------------------------------------

const SEVERITY_VAR = { high:"high", medium:"med", low:"low" };
function sevLabel(key){ return t('sev_' + key); }

function credibilityTier(score){
  if(score >= 85) return { label:t('cred_high'), css:"cred-high" };
  if(score >= 65) return { label:t('cred_med'), css:"cred-med" };
  return { label:t('cred_low'), css:"cred-low" };
}

let INCIDENTS = [];
let filters = { asset:null, country:null, severity:null, attack_type:null };
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
    main.innerHTML = `<div class="error">${t('error', err.message)}</div>`;
  }
}

function uniqueCounts(key){
  const counts = {};
  INCIDENTS.forEach(i => counts[i[key]] = (counts[i[key]]||0) + 1);
  return counts;
}

function renderFilters(){
  renderFilterGroup('filter-asset', 'asset', uniqueCounts('asset'));
  renderFilterGroup('filter-attack', 'attack_type', uniqueCounts('attack_type'));
  renderFilterGroup('filter-country', 'country', uniqueCounts('country'));
  renderFilterGroup('filter-severity', 'severity', uniqueCounts('severity'), { high:sevLabel('high'), medium:sevLabel('medium'), low:sevLabel('low') });
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
  filters = { asset:null, country:null, severity:null, attack_type:null };
  renderAll();
}

function filteredIncidents(){
  return INCIDENTS.filter(i =>
    (!filters.asset || i.asset === filters.asset) &&
    (!filters.country || i.country === filters.country) &&
    (!filters.severity || i.severity === filters.severity) &&
    (!filters.attack_type || i.attack_type === filters.attack_type)
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
      <div class="label">${t('stat_total')}</div>
    </div>
    <div class="stat" style="flex:2">
      <div class="label" style="margin-bottom:8px;">${t('stat_top_assets')}</div>
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

function renderHeatmap(){
  const el = document.getElementById('heatmap');
  const severities = ['low','medium','high'];
  const assets = [...new Set(INCIDENTS.map(i => i.asset))];
  const counts = {};
  assets.forEach(a => { counts[a] = {low:0, medium:0, high:0}; });
  INCIDENTS.forEach(i => { counts[i.asset][i.severity]++; });

  el.innerHTML = assets.map(asset => `
    <div class="heat-row">
      <div class="heat-label">${asset}</div>
      <div class="heat-cells">
        ${severities.map(sev => {
          const n = counts[asset][sev];
          const bg = n === 0 ? null : `var(--sev-${SEVERITY_VAR[sev]})`;
          return `<div class="heat-cell${n===0?' empty':''}" style="${bg?`background:${bg}`:''}"
                       title="${asset} · ${sevLabel(sev)}: ${n}건"
                       onclick="${n>0?`filters.asset='${asset}';filters.severity='${sev}';renderAll();`:''}">${n>0?n:''}</div>`;
        }).join('')}
      </div>
    </div>
  `).join('') + `
    <div class="heat-legend">
      <span><i style="background:var(--sev-low)"></i>낮음</span>
      <span><i style="background:var(--sev-med)"></i>중간</span>
      <span><i style="background:var(--sev-high)"></i>높음</span>
      <span style="color:var(--text-dim)">${t('heatmap_hint')}</span>
    </div>
  `;
}

function renderList(){
  const list = filteredIncidents().sort((a,b) => b.date.localeCompare(a.date));
  document.getElementById('list-count').textContent = t('list_count', list.length);
  const el = document.getElementById('incident-list');
  el.innerHTML = '';
  list.forEach(i => {
    const row = document.createElement('div');
    row.className = 'incident' + (i.id === selectedId ? ' selected' : '');
    row.innerHTML = `
      <div class="sev-dot" style="background:var(--sev-${SEVERITY_VAR[i.severity]})"></div>
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
  if(!i){ el.innerHTML = `<div class="empty">${t('detail_empty')}</div>`; return; }
  const cred = credibilityTier(i.credibility_score);
  el.innerHTML = `
    <div class="id">${i.id}</div>
    <h3>${i.title}</h3>
    <div class="meta-row">
      <span class="tag">${i.asset}</span>
      <span class="tag">${i.attack_type}</span>
      <span class="tag">${i.country}</span>
      <span class="tag" style="color:var(--sev-${SEVERITY_VAR[i.severity]})">${sevLabel(i.severity)}</span>
      <span class="tag">${i.date}</span>
    </div>
    <p class="desc">${i.desc}</p>
    <div class="fact-grid">
      <div class="fact-label">${t('fact_damage')}</div><div class="fact-value">${i.damage_scale}</div>
      <div class="fact-label">${t('fact_credibility')}</div>
      <div class="fact-value">
        <span class="cred-badge ${cred.css}">${i.credibility_score} · ${cred.label}</span>
      </div>
      <div class="fact-label">${t('fact_language')}</div>
      <div class="fact-value">${i.origin_language}${i.translated ? ` <span class="translated-tag">${t('translated_tag')}</span>` : ''}</div>
      <div class="fact-label">${t('fact_source')}</div>
      <div class="fact-value">${i.source.url ? `<a href="${i.source.url}" target="_blank" rel="noopener">${i.source.name}</a>` : i.source.name}</div>
    </div>
    <div class="reg-block">
      <h4>${t('regs_header')}</h4>
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
  renderHeatmap();
  renderList();
  renderDetail();
}

document.addEventListener('DOMContentLoaded', loadData);
