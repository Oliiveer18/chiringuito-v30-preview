/* v32: mapa de la isla. Los locales de la marca dejan de ser una línea de
   compra: son lugares en el mapa. La pestaña Isla del plan muestra la costa
   de Tenerife con tu chiringuito y los locales del imperio, su noche
   prevista y el acontecimiento de marca. Importado desde ui.js (pestaña). */
import { Game, BRAND_EVENTS, EMPIRE_EVENT_LABEL, brandEvent, empireIncome, lvl } from './state.js?v=32.0.0';
import { UPGRADES } from './config.js?v=32.0.0';
import { $, escapeHtml, eur } from './util.js?v=32.0.0';
import { Plan } from './ui.js?v=32.0.0';

/* Costa sur de Tenerife, oeste → este: Adeje (kiosco), Los Cristianos,
   El Médano. La cadena de compra sigue siendo kiosco → El Médano → Los
   Cristianos. */
const MAP_SPOTS = {
  kiosco:        { x: 98,  y: 160, name: 'Tu chiringuito' },
  loscristianos: { x: 238, y: 184, name: 'Los Cristianos' },
  elmedano:      { x: 292, y: 170, name: 'El Médano' },
};

/* Datos puros del mapa (testeables sin navegador): una ficha por lugar. */
export function islandMapData(){
  const emp = empireIncome();
  const cards = [];
  const upg = id => UPGRADES.find(u => u.id === id);
  cards.push({ id:'kiosco', name:MAP_SPOTS.kiosco.name, owned:true, note:`La playa donde empezó todo · kiosco nivel ${1 + Math.min(3, lvl('palapa') + lvl('terraza') + lvl('escenario'))}/4` });
  for(const id of ['elmedano','loscristianos']){
    const u = upg(id), spot = MAP_SPOTS[id];
    const v = emp.owned.find(o => o.id === id);
    if(v) cards.push({ id, name:spot.name, owned:true, income:v.income, event:v.event, note:`+${eur(v.income)} esta noche${v.event ? ` · ${EMPIRE_EVENT_LABEL[v.event]}` : ''}` });
    else cards.push({ id, name:spot.name, owned:false, price:u.levels[0], req:u.req, note:`Todavía no es tuyo · ${eur(u.levels[0])} en Mejoras` });
  }
  return { cards, brand: brandEvent(Game.day), empireTotal: emp.total };
}

function svgMap(data){
  const ownedIds = new Set(data.cards.filter(c => c.owned).map(c => c.id));
  const markers = data.cards.map(c => {
    const s = MAP_SPOTS[c.id];
    const own = ownedIds.has(c.id);
    const col = own ? '#0f8b8d' : '#b3a78f';
    return `<g class="map-spot ${own ? 'on' : ''}">
      ${own ? `<circle cx="${s.x}" cy="${s.y}" r="13" fill="#0f8b8d22"/>` : ''}
      <circle cx="${s.x}" cy="${s.y}" r="7" fill="${col}" stroke="#fffdf8" stroke-width="2.5"/>
      ${own ? `<circle cx="${s.x}" cy="${s.y}" r="2.6" fill="#fffdf8"/>` : `<text x="${s.x}" y="${s.y + 3.4}" text-anchor="middle" font-size="9" fill="#fffdf8">?</text>`}
      <text x="${s.x}" y="${s.y - 16}" text-anchor="middle" font-size="12" font-weight="700" fill="${own ? '#0d5c5e' : '#8a7f6a'}">${escapeHtml(s.name)}</text>
    </g>`;
  }).join('');
  /* ruta de la marca: une los locales que ya son tuyos (oeste → este);
     segmentos <line> para que ningún renderizador la pinte como figura rellena */
  const ownSpots = ['kiosco', 'loscristianos', 'elmedano']
    .filter(id => ownedIds.has(id))
    .map(id => MAP_SPOTS[id]);
  const route = ownSpots.slice(0, -1).map((s, i) => {
    const t = ownSpots[i + 1];
    return `<line x1="${s.x}" y1="${s.y}" x2="${t.x}" y2="${t.y}" stroke="#0f8b8d" stroke-width="2.5" stroke-dasharray="6 6" opacity="0.85"/>`;
  }).join('');
  return `<svg class="island-svg" viewBox="0 0 380 240" role="img" aria-label="Mapa de la isla con los locales de la marca">
    <rect x="0" y="0" width="380" height="240" rx="14" fill="#cfe8ea"/>
    <path d="M70,52 C95,30 150,18 205,26 C260,34 310,52 330,86 C348,116 344,150 322,172 C300,194 262,204 228,200 C210,198 196,190 178,192 C150,196 120,190 98,176 C76,162 58,140 54,116 C50,92 54,70 70,52 Z" fill="#ead9b4" stroke="#d8c391" stroke-width="2"/>
    <path d="M150,96 L196,58 L232,110 L196,122 Z" fill="#c9b98a" opacity="0.8"/>
    <text x="196" y="142" text-anchor="middle" font-size="10" fill="#8a7f6a">El Teide</text>
    ${route}
    ${markers}
  </svg>`;
}

export function renderIsla(){
  const b = $('#tab-body'); if(!b || Plan.tab !== 'isla') return;
  const data = islandMapData();
  let h = `<p class="muted" style="margin:0 0 8px">La marca, vista desde arriba: tu chiringuito y los locales del imperio en la costa de la isla. Lo que pasa en uno, se nota en todos.</p>`;
  if(data.brand) h += `<div class="fc event"><div class="k">Marca</div><div class="v">${escapeHtml(BRAND_EVENTS[data.brand].label)}</div><div class="d">${escapeHtml(BRAND_EVENTS[data.brand].desc)}</div></div>`;
  h += svgMap(data);
  h += `<div class="map-cards">`;
  for(const c of data.cards){
    h += `<article class="map-card ${c.owned ? 'own' : 'locked'}"><div class="map-card-head">${escapeHtml(c.name)} ${c.owned ? '<span class="tag good">Tuyo</span>' : '<span class="tag">No comprado</span>'}</div><div class="map-card-body">${escapeHtml(c.note)}</div></article>`;
  }
  h += `</div>`;
  if(data.cards.some(c => !c.owned)) h += `<p class="muted" style="margin:8px 0 0">Los locales se compran en la pestaña Mejoras. El Médano exige el Escenario; Los Cristianos, El Médano. Ingresan cada noche según tu reputación.</p>`;
  b.innerHTML = h;
}
new MutationObserver(renderIsla).observe(document.getElementById('tab-body'), { childList: true });
setInterval(renderIsla, 800);
