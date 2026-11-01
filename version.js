export const VERSION='v32.0.0';
export const LABEL='v32.0.0 · la marca: mapa de la isla con tus locales (pestaña Isla), capacidad multicanal por primera vez visible (barra, terraza, express y marca nocturna con semáforo) y eventos de marca que mueven afluencia y noches (guía de la isla, reportaje en la tele, queja vecinal) · v31: el imperio con vida propia';
document.documentElement.dataset.version=VERSION;
const old=document.getElementById('version-badge');if(old)old.remove();
const title=document.getElementById('ver-title');if(title)title.textContent=LABEL;
for(const sel of ['#lobby .lobby-card','#plan .sheet','#report .sheet']){const host=document.querySelector(sel);if(host&&!host.querySelector('.ver-line')){const p=document.createElement('p');p.className='ver-line';p.textContent=LABEL;host.append(p);}}
