// ---------------------------------------------------------
// UI 문자열 다국어 사전입니다. 여기 있는 건 전부 "화면 UI 텍스트"이고,
// 사고 제목/설명 같은 실제 데이터 번역은 data.json의 translated/
// origin_language 필드와 별개로, 추후 번역 파이프라인이 채워줄 부분입니다.
// 새 언어를 추가하려면 아래 I18N 객체에 언어 코드를 하나 더 추가하면 됩니다.
// ---------------------------------------------------------

const I18N = {
  ko: {
    site_title: "해양 사이버보안사고 대시보드",
    nav_dashboard: "대시보드",
    nav_stats: "통계",
    dashboard_subtitle: "자산유형별 위협 가시화 · IMO/IACS 규제 연계",
    stats_subtitle: "통계 — 국가별 · 공격유형별 · 연도별 추이",
    filter_asset: "자산 유형",
    filter_attack: "공격 유형",
    filter_country: "피해 국가",
    filter_severity: "심각도",
    reset_filters: "필터 초기화",
    list_count: (n) => `${n}건 표시 중`,
    detail_empty: "사고를 선택하면<br>상세 정보와 관련 규제가<br>여기에 표시됩니다",
    loading: "데이터를 불러오는 중...",
    error: (msg) => `데이터를 불러오는 중 오류가 발생했습니다: ${msg}`,
    sev_high: "높음", sev_medium: "중간", sev_low: "낮음",
    fact_damage: "피해 규모",
    fact_credibility: "신뢰도",
    fact_language: "원문 언어",
    fact_source: "출처",
    translated_tag: "번역됨",
    cred_high: "높음", cred_med: "중간", cred_low: "검증 필요",
    regs_header: "관련 IMO / IACS 통제 항목",
    heatmap_title: "자산유형 × 심각도",
    heatmap_hint: "(칸을 클릭하면 필터링됩니다)",
    stat_total: "전체 사고 건수",
    stat_top_assets: "자산유형별 상위 3",
    total_count: (n) => `전체 ${n}건 기준`,
    ts_title: "연도별 사고 추이",
    country_title: "국가별 사고 건수",
    attack_title: "공격 유형별 사고 건수",
    th_country: "국가",
    th_attack: "공격 유형",
    th_count: "건수",
    th_share: "비중",
    footer_html: (url, name) => `데이터 출처: <a href="${url}" target="_blank" rel="noopener">${name}</a>. 위 데이터는 연구 목적으로 정규화·가공되었습니다.`,
  },
  en: {
    site_title: "Maritime Cybersecurity Incident Dashboard",
    nav_dashboard: "Dashboard",
    nav_stats: "Statistics",
    dashboard_subtitle: "Threat visibility by asset type · Linked to IMO/IACS controls",
    stats_subtitle: "Statistics — by country · attack type · yearly trend",
    filter_asset: "Asset Type",
    filter_attack: "Attack Type",
    filter_country: "Victim Country",
    filter_severity: "Severity",
    reset_filters: "Reset Filters",
    list_count: (n) => `${n} incidents shown`,
    detail_empty: "Select an incident to see<br>details and related regulations<br>here",
    loading: "Loading data...",
    error: (msg) => `Failed to load data: ${msg}`,
    sev_high: "High", sev_medium: "Medium", sev_low: "Low",
    fact_damage: "Impact",
    fact_credibility: "Credibility",
    fact_language: "Original Language",
    fact_source: "Source",
    translated_tag: "Translated",
    cred_high: "High", cred_med: "Medium", cred_low: "Needs review",
    regs_header: "Related IMO / IACS Controls",
    heatmap_title: "Asset Type × Severity",
    heatmap_hint: "(click a cell to filter)",
    stat_total: "Total Incidents",
    stat_top_assets: "Top 3 Asset Types",
    total_count: (n) => `Based on ${n} incidents`,
    ts_title: "Incidents Over Time",
    country_title: "Incidents by Country",
    attack_title: "Incidents by Attack Type",
    th_country: "Country",
    th_attack: "Attack Type",
    th_count: "Count",
    th_share: "Share",
    footer_html: (url, name) => `Data source: <a href="${url}" target="_blank" rel="noopener">${name}</a>. Normalized and processed for research purposes.`,
  }
};

const LANG_KEY = 'mcad_lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'ko';
if(!I18N[currentLang]) currentLang = 'ko';

function t(key, ...args){
  const entry = I18N[currentLang][key];
  if(typeof entry === 'function') return entry(...args);
  return entry !== undefined ? entry : key;
}

function setLang(lang){
  if(!I18N[lang]) return;
  localStorage.setItem(LANG_KEY, lang);
  location.reload();
}

function applyStaticI18n(){
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('.lang-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.onclick = () => setLang(btn.dataset.lang);
  });
  const footer = document.getElementById('site-footer');
  if(footer){
    footer.innerHTML = t('footer_html',
      'https://www.nhlstenden.com/en/maritime-cyber-attack-database',
      'NHL Stenden — Maritime Cyber Attack Database (MCAD)');
  }
}

document.addEventListener('DOMContentLoaded', applyStaticI18n);
