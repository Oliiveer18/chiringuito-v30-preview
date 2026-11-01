export const VERSION='v31.1.0';
export const LABEL='v31.1.0 · el imperio con vida propia: cada local tiene su noche (ritmo propio, finde turístico) y acontecimientos que el plan anuncia y el informe explica (avería −50%, fiesta del pueblo +30%) · base v31: locales de marca en El Médano y Los Cristianos que ingresan cada noche según tu reputación';
document.documentElement.dataset.version=VERSION;
const old=document.getElementById('version-badge');if(old)old.remove();
const title=document.getElementById('ver-title');if(title)title.textContent=LABEL;
for(const sel of ['#lobby .lobby-card','#plan .sheet','#report .sheet']){const host=document.querySelector(sel);if(host&&!host.querySelector('.ver-line')){const p=document.createElement('p');p.className='ver-line';p.textContent=LABEL;host.append(p);}}
