/* Pruebas de la marca v32 (sin navegador). Uso: node brand.test.mjs
   Cubre: eventos de marca deterministas (frecuencia y multiplicadores, solo
   con imperio), efecto en el ingreso nocturno de los locales y en la
   afluencia prevista, mapa de isla (fichas de lugares y ruta de la marca) y
   capacidad multicanal (canales con semáforo, express con Escenario, marca
   fuera de la jornada). */
import assert from 'node:assert/strict';
import { register } from 'node:module';

/* ---------- stubs de módulos con DOM (patrón forecast-guard) ---------- */
const STUBS = {
  './ui.js': "export const Plan={tab:'isla'};export const toasts=[];export const toast=(t,x,k)=>{toasts.push([t,x,k]);};export const toastLocal=toast;export function renderTab(){};export function showPlan(){};export function hideAll(){};export function showFinal(){};export function updateReadyUI(){};export function refreshPlanMoney(){};export function estimateCustomers(){return 100;};",
  './net.js': "export const sent=[];export const netDirty=()=>{};export const netAct=o=>{sent.push(o);};",
  './sim.js': "export function buyStock(){};export function difficultyProfile(){return{arrivals:1,patience:1,peak:0,label:''};};export function difficultyRush(){return 1;};export function newSeason(){};export function startDay(){};",
  './icons.js': "export const ICON_URL={};export const EXTRA={};export function rr(){};",
  './render.js': "export function drawPerson(){};",
  './report.js': "export function advanceFromReport(){};",
  './audio.js': "export const Audio={good(){},_raw:{}};",
  './bookkeeping.js': "export function trackCost(){};",
};
const hook = 'const S=' + JSON.stringify(STUBS) + ';export async function resolve(s,c,n){const base=s.split("?")[0];const stub=S[s]||S[base];if(stub)return{url:"data:text/javascript,"+encodeURIComponent(stub),shortCircuit:true};return n(s,c);}';
register('data:text/javascript,' + encodeURIComponent(hook), import.meta.url);

/* ---------- DOM mínimo ---------- */
const elements = {};
const el = () => ({ dataset:{}, style:{ setProperty(){} }, classList:{ add(){}, remove(){}, toggle(){}, contains(){ return false; } }, append(){}, appendChild(){}, remove(){}, querySelector:()=>null, querySelectorAll:()=>[], setAttribute(){}, addEventListener(){}, innerHTML:'', textContent:'', childElementCount:0, children:[], getClientRects:()=>[], getBoundingClientRect:()=>({height:0,top:0,left:0,width:0}) });
globalThis.window = globalThis;
globalThis.document = {
  querySelector: s => (elements[s] || (elements[s] = el())),
  getElementById: id => (elements['#' + id] || (elements['#' + id] = el())),
  createElement: () => el(),
  documentElement: el(), body: el(), head: el(), addEventListener(){},
};
globalThis.innerWidth = 1280; globalThis.innerHeight = 720;
globalThis.getComputedStyle = globalThis.getComputedStyle || (() => ({ getPropertyValue: () => '0' }));
globalThis.requestAnimationFrame = globalThis.requestAnimationFrame || (() => 0);
globalThis.addEventListener = globalThis.addEventListener || (() => {});
globalThis.MutationObserver = class { observe() {} };
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };

let ok = 0, ko = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('  ok  ' + name); } else { ko++; console.log('  FALLO  ' + name + (extra !== undefined ? ' → ' + JSON.stringify(extra) : '')); } };

/* ---------- módulos reales ---------- */
const S = await import('./state.js?v=32.0.0');
const { Game } = S;
const cfg = await import('./config.js?v=32.0.0');
const plan = await import('./ui-plan.js?v=32.0.0');
const map = await import('./island-map.js?v=32.0.0');
const fresh = () => { Game.upgrades = {}; Game.money = 400; Game.day = 1; Game.rep = 3; };

console.log('Eventos de marca (modelo)');
fresh();
check('sin imperio no hay eventos de marca', [1,2,3,4,5].every(d => S.brandEvent(d) === null));
Game.upgrades.elmedano = 1;
const counts = { guia:0, tv:0, queja:0, ninguno:0 };
for (let d = 1; d <= 300; d++) { const e = S.brandEvent(d); counts[e || 'ninguno']++; }
check('los tres eventos existen y son poco frecuentes (≈8% cada uno)', counts.guia >= 10 && counts.tv >= 8 && counts.queja >= 8, counts);
check('la mayoría de días no pasa nada (≈75–80%)', counts.ninguno >= 200, counts.ninguno);
check('determinista: mismo día, mismo evento', S.brandEvent(77) === S.brandEvent(77));
check('los eventos buenos suben la noche y los malos la bajan', S.BRAND_EVENTS.tv.empireMul > 1 && S.BRAND_EVENTS.guia.empireMul >= 1 && S.BRAND_EVENTS.queja.empireMul < 1);
check('la guía mueve la afluencia de la playa (+15%)', S.BRAND_EVENTS.guia.arrMul > 1 && S.BRAND_EVENTS.guia.arrMul <= 1.2);

console.log('Evento de marca en el ingreso nocturno');
const rhythm = d => 0.88 + 0.24 * ((Math.imul(d, 2654435761) >>> 0) % 1000 / 1000);
const tvDays = []; for (let d = 1; d <= 300; d++) if (S.brandEvent(d) === 'tv') tvDays.push(d);
check('el reportaje sube un 50% la noche de todos los locales', tvDays.length > 0 && tvDays.every(d => S.empireVenueNight('elmedano', d, 3) === Math.round((400 + 450) * rhythm(d) * (S.isWeekend(d) ? 1.25 : 1) * (S.empireVenueEvent('elmedano', d) === 'averia' ? 0.5 : S.empireVenueEvent('elmedano', d) === 'fiesta' ? 1.3 : 1) * 1.5)), tvDays.length);
const quejaDays = []; for (let d = 1; d <= 300; d++) if (S.brandEvent(d) === 'queja') quejaDays.push(d);
check('la queja vecinal baja un 30% la noche', quejaDays.length > 0 && quejaDays.every(d => S.empireVenueNight('loscristianos', d, 3) === Math.round((400 + 450) * rhythm(d) * (S.isWeekend(d) ? 1.25 : 1) * (S.empireVenueEvent('loscristianos', d) === 'averia' ? 0.5 : S.empireVenueEvent('loscristianos', d) === 'fiesta' ? 1.3 : 1) * 0.7)), quejaDays.length);
const brandDay = tvDays[0], noBrandDay = [1,2,3,4,5,6,7,8].find(d => S.brandEvent(d) === null);
Game.day = brandDay; Game.upgrades.elmedano = 1; Game.upgrades.loscristianos = 1;
const withBrand = S.empireIncome();
check('empireIncome refleja el evento de marca del día', withBrand.total === withBrand.owned.reduce((s,v)=>s+v.income,0) && withBrand.owned.every(v => v.income === S.empireVenueNight(v.id, brandDay, 3)));

console.log('Mapa de isla (pestaña Isla)');
fresh();
let data = map.islandMapData();
check('el mapa tiene tres lugares: kiosco y dos locales', data.cards.length === 3 && data.cards.some(c => c.id === 'kiosco' && c.owned));
check('sin comprar, los locales salen con precio y requisito', (() => { const em = data.cards.find(c => c.id === 'elmedano'); return !em.owned && em.price === 25000 && em.req === 'escenario'; })());
Game.upgrades.escenario = 1; Game.upgrades.elmedano = 1; Game.day = 6; Game.rep = 4;
data = map.islandMapData();
const em = data.cards.find(c => c.id === 'elmedano');
check('comprado, el local muestra su noche prevista', em.owned && em.income === S.empireVenueNight('elmedano', 6, 4));
check('el evento de marca del día viaja con el mapa', data.brand === S.brandEvent(6));
map.renderIsla();
const html = elements['#tab-body'].innerHTML;
check('renderIsla pinta el SVG del mapa', html.includes('<svg') && html.includes('Tu chiringuito'));
check('renderIsla pinta los nombres de los locales', html.includes('El Médano') && html.includes('Los Cristianos'));
check('los locales sin comprar aparecen bloqueados', html.includes('No comprado'));
Game.upgrades.loscristianos = 1;
map.renderIsla();
check('la ruta de la marca une los locales tuyos', elements['#tab-body'].innerHTML.includes('stroke-dasharray'));

console.log('Capacidad multicanal');
fresh();
let chn = plan.channelsCapacity();
check('sin imperio ni escenario: barra, terraza y nada más', chn.rows.length === 2 && chn.rows[0].id === 'barra' && chn.rows[1].id === 'terraza');
check('la barra muestra su ritmo y su semáforo', chn.rows[0].v.includes('/h') && ['good','mid','bad'].includes(chn.rows[0].tag));
Game.upgrades.escenario = 1; Game.upgrades.elmedano = 1; Game.day = 3; Game.rep = 4;
chn = plan.channelsCapacity();
check('con Escenario aparece la ventanilla express', chn.rows.some(r => r.id === 'express'));
check('con imperio aparece el canal Marca (nocturno)', chn.rows.some(r => r.id === 'marca' && r.v.includes('+')));
const marca = chn.rows.find(r => r.id === 'marca');
check('el canal Marca no consume capacidad del día', marca.d.includes('al cierre'));

console.log(ok + ' ok · ' + ko + ' fallos');
process.exit(ko ? 1 : 0);
