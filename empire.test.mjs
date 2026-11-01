/* Pruebas del imperio v31 (sin navegador). Uso: node empire.test.mjs
   Cubre: fórmula base por local (400 € + 150 € · reputación), ritmo propio
   determinista por día (±12%), finde turístico (+25%), acontecimientos
   puntuales (avería −50%, fiesta del pueblo +30%), desglose por local y
   coherencia plan↔informe (misma noche, misma cifra, siempre). */
globalThis.window = globalThis;
const store = {};
globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };

const { Game } = await import('./state.js?v=32.1.0');
const S = await import('./state.js?v=32.1.0');

let ok = 0, ko = 0;
const check = (name, cond, extra) => { if (cond) { ok++; console.log('  ok  ' + name); } else { ko++; console.log('  FALLO  ' + name + (extra !== undefined ? ' → ' + JSON.stringify(extra) : '')); } };
const fresh = () => { Game.upgrades = {}; Game.money = 400; Game.day = 1; Game.rep = 3; };
const rhythm = d => 0.88 + 0.24 * ((Math.imul(d, 2654435761) >>> 0) % 1000 / 1000);

console.log('Fórmula base y ritmo propio');
fresh();
const base = 400 + 150 * 3;
const calm = [];
for (let d = 1; d <= 60; d++) if (!S.isWeekend(d) && !S.empireVenueEvent('elmedano', d)) calm.push(d);
check('hay noches tranquilas que midan la base (laborables sin acontecimiento)', calm.length >= 20, calm.length);
check('sin finde ni acontecimiento, el ingreso es la base con ritmo ±12%', calm.every(d => { const v = S.empireVenueNight('elmedano', d, 3); return v >= Math.round(base * 0.88) && v <= Math.round(base * 1.12); }));
const varied = new Set(calm.map(d => S.empireVenueNight('elmedano', d, 3)));
check('el ritmo hace noches distintas (la zona tiene su vida)', varied.size > 20, varied.size);
check('la reputación alimenta la base: 5★ ingresa más que 3★', S.empireVenueNight('elmedano', 9, 5) > S.empireVenueNight('elmedano', 9, 3));

console.log('Finde turístico');
const calmWeekend = [];
for (let d = 1; d <= 60; d++) if (S.isWeekend(d) && !S.empireVenueEvent('elmedano', d)) calmWeekend.push(d);
check('el finde sube el ingreso un 25% (mismo ritmo del día)', calmWeekend.every(d => S.empireVenueNight('elmedano', d, 3) === Math.round(base * rhythm(d) * 1.25)), calmWeekend.length);

console.log('Acontecimientos');
const averiaDays = [], fiestaDays = [];
for (let d = 1; d <= 200; d++) { const ev = S.empireVenueEvent('elmedano', d); if (ev === 'averia') averiaDays.push(d); if (ev === 'fiesta') fiestaDays.push(d); }
check('la avería es poco frecuente (≈8% de las noches)', averiaDays.length >= 8 && averiaDays.length <= 32, averiaDays.length);
check('la fiesta del pueblo también aparece (≈8%)', fiestaDays.length >= 8 && fiestaDays.length <= 32, fiestaDays.length);
const wkMul = d => S.isWeekend(d) ? 1.25 : 1;
check('la avería reduce a la mitad el ingreso de esa noche', averiaDays.every(d => S.empireVenueNight('elmedano', d, 3) === Math.round(base * rhythm(d) * wkMul(d) * 0.5)));
check('la fiesta del pueblo sube el ingreso un 30%', fiestaDays.every(d => S.empireVenueNight('elmedano', d, 3) === Math.round(base * rhythm(d) * wkMul(d) * 1.3)));
check('determinista: misma noche, mismo resultado', S.empireVenueEvent('elmedano', 42) === S.empireVenueEvent('elmedano', 42) && S.empireVenueNight('elmedano', 42, 3) === S.empireVenueNight('elmedano', 42, 3));
let diff = 0; for (let d = 1; d <= 60; d++) if (S.empireVenueEvent('elmedano', d) !== S.empireVenueEvent('loscristianos', d)) diff++;
check('los dos locales no viven siempre la misma noche', diff > 10, diff);

console.log('Desglose por local y coherencia plan↔informe');
fresh(); Game.day = 42; Game.rep = 4.2; Game.upgrades.elmedano = 1; Game.upgrades.loscristianos = 1;
const e = S.empireIncome();
check('total = suma de las noches de cada local', e.total === e.owned.reduce((s, v) => s + v.income, 0));
check('cada local lleva nombre y acontecimiento válidos', e.owned.every(v => v.name && (v.event === null || ['averia', 'fiesta'].includes(v.event))));
check('el acontecimiento del local coincide con el de su noche', e.owned.every(v => v.event === S.empireVenueEvent(v.id, 42)));
check('el ingreso por local usa la reputación actual', e.owned.every(v => v.income === S.empireVenueNight(v.id, 42, 4.2)));
const eA = S.empireIncome(), eB = S.empireIncome();
check('plan e informe siempre coinciden (misma noche, misma cifra)', eA.total === eB.total && JSON.stringify(eA) === JSON.stringify(eB));
fresh();
check('sin locales, el imperio no ingresa', S.empireIncome().total === 0 && S.empireIncome().owned.length === 0);

console.log(ok + ' ok · ' + ko + ' fallos');
if (ko) process.exit(1);
