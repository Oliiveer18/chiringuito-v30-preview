export const VERSION='v32.1.0';
export const LABEL='v32.1.0 · vista previa de pruebas: caja inicial de 150.000 € para comprarlo todo — reformas del chiringuito (v30), imperio (v31) y resto de mejoras — · arreglado el banner rojo de consola (ResizeObserver loop): la medida del HUD se aplaza al siguiente frame y el aviso ya no sale';
document.documentElement.dataset.version=VERSION;
const old=document.getElementById('version-badge');if(old)old.remove();
const title=document.getElementById('ver-title');if(title)title.textContent=LABEL;
for(const sel of ['#lobby .lobby-card','#plan .sheet','#report .sheet']){const host=document.querySelector(sel);if(host&&!host.querySelector('.ver-line')){const p=document.createElement('p');p.className='ver-line';p.textContent=LABEL;host.append(p);}}
