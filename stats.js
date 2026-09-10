let INCIDENTS = [];

async function loadData(){
  try{
    const res = await fetch('data.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('data.json을 불러오지 못했습니다 (' + res.status + ')');
    INCIDENTS = await res.json();
    renderAll();
  }catch(err){
    document.querySelector('main').innerHTML = `<div class="error">데이터를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`;
  }
}

function countBy(key){
  const counts = {};
  INCIDENTS.forEach(i => { counts[i[key]] = (counts[i[key]] || 0) + 1; });
  return Object.entries(counts).sort((a,b) => b[1]-a[1]);
}

function renderBarChart(containerId, tableId, entries, colLabel){
  const max = Math.max(...entries.map(([,n]) => n));
  document.getElementById(containerId).innerHTML = entries.map(([name, n]) => `
    <div class="bar-row">
      <span style="width:150px; color:var(--text);" title="${name}">${name}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(n/max*100)}%"></div></div>
      <span style="width:24px; text-align:right;">${n}</span>
    </div>
  `).join('');

  const table = document.getElementById(tableId);
  table.innerHTML = `
    <thead><tr><th>${colLabel}</th><th>건수</th><th>비중</th></tr></thead>
    <tbody>
      ${entries.map(([name, n]) => `
        <tr>
          <td>${name}</td>
          <td>${n}</td>
          <td>${(n / INCIDENTS.length * 100).toFixed(1)}%</td>
        </tr>
      `).join('')}
    </tbody>
  `;
}

function renderTimeSeries(){
  const byYear = {};
  INCIDENTS.forEach(i => {
    const year = i.date.slice(0, 4);
    byYear[year] = (byYear[year] || 0) + 1;
  });
  const years = Object.keys(byYear).sort();
  const values = years.map(y => byYear[y]);
  const max = Math.max(...values, 1);

  const W = 640, H = 200, PAD = 36;
  const stepX = years.length > 1 ? (W - PAD*2) / (years.length - 1) : 0;
  const points = values.map((v, idx) => {
    const x = PAD + idx * stepX;
    const y = H - PAD - (v / max) * (H - PAD*2);
    return [x, y];
  });
  const linePath = points.map((p, idx) => (idx === 0 ? 'M' : 'L') + p[0] + ',' + p[1]).join(' ');
  const areaPath = linePath + ` L${points[points.length-1][0]},${H-PAD} L${points[0][0]},${H-PAD} Z`;

  const gridLines = [0, 0.5, 1].map(f => {
    const y = H - PAD - f * (H - PAD*2);
    return `<line x1="${PAD}" y1="${y}" x2="${W-PAD}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`;
  }).join('');

  const dots = points.map((p, idx) => `
    <circle cx="${p[0]}" cy="${p[1]}" r="4" fill="var(--accent)" stroke="var(--bg)" stroke-width="2"/>
    <text x="${p[0]}" y="${p[1]-12}" fill="var(--text)" font-size="11" text-anchor="middle">${values[idx]}</text>
    <text x="${p[0]}" y="${H-PAD+18}" fill="var(--text-dim)" font-size="11" text-anchor="middle">${years[idx]}</text>
  `).join('');

  document.getElementById('timeseries').innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" style="width:100%; height:auto;">
      ${gridLines}
      <path d="${areaPath}" fill="var(--accent)" opacity="0.12"/>
      <path d="${linePath}" fill="none" stroke="var(--accent)" stroke-width="2"/>
      ${dots}
    </svg>
  `;
  document.getElementById('total-count').textContent = `전체 ${INCIDENTS.length}건 기준`;
}

function renderAll(){
  renderTimeSeries();
  renderBarChart('country-chart', 'country-table', countBy('country'), '국가');
  renderBarChart('attack-chart', 'attack-table', countBy('attack_type'), '공격 유형');
}

document.addEventListener('DOMContentLoaded', loadData);
