import { icon } from '../dist/lookup.js';

const t = (key, fallback) => (window.pgI18n ? window.pgI18n.t(key) : fallback);

const scene = document.getElementById('comparison-scene');
const slider = document.getElementById('comparison-slider');
const names = {
  heart: 'heart', coin: 'coins', gem: 'gem', settings: 'settings', pause: 'pause',
  backpack: 'backpack', sword: 'sword', shield: 'shield', potion: 'flask-conical', map: 'map', gift: 'gift',
};

// Vendored, unmodified Lucide SVGs; no CDN or gallery filter dependency.
const lucide = Object.fromEntries(await Promise.all(Object.entries(names).map(async ([name, file]) => {
  const response = await fetch(new URL(`./assets/lucide/${file}.svg`, import.meta.url));
  if (!response.ok) throw new Error(`Could not load Lucide icon: ${file}`);
  return [name, await response.text()];
})));

function renderHud(style) {
  const glyph = (name) => `<span class="hud-icon">${style === 'lucide' ? lucide[name] : icon(name, { style: 'pixel', size: 32 })}</span>`;
  return `<div class="hud-top">
    <div class="hud-health hud-panel">${Array.from({ length: 4 }, () => glyph('heart')).join('')}</div>
    <div class="hud-currencies">
      <span class="hud-currency hud-panel">${glyph('coin')}<span>1,280</span></span>
      <span class="hud-currency hud-panel">${glyph('gem')}<span>48</span></span>
    </div>
    <div class="hud-system"><span class="hud-panel">${glyph('settings')}</span><span class="hud-panel">${glyph('pause')}</span></div>
  </div>
  <div class="hud-quest hud-panel">${glyph('gift')}<div><strong>${t('hud.quest', '숲속의 작은 모험')}</strong><small>${t('hud.questStep', '숨겨진 보물 찾기 · 2 / 3')}</small></div></div>
  <div class="hud-hotbar hud-panel">${['sword', 'shield', 'potion', 'map', 'backpack'].map((name, i) => `<span class="hud-slot${i === 0 ? ' is-selected' : ''}"><small>${i + 1}</small>${glyph(name)}</span>`).join('')}</div>
  <div class="hud-location"><small>EXPLORING</small><strong>${t('hud.location', '고요한 숲')}</strong></div>`;
}

document.getElementById('hud-lucide').innerHTML = renderHud('lucide');
document.getElementById('hud-playglyph').innerHTML = renderHud('playglyph');

let position = 50;
let activePointer = null;
function update(value) {
  position = Math.max(0, Math.min(100, Math.round(value)));
  scene.style.setProperty('--split', `${position}%`);
  slider.setAttribute('aria-valuenow', position);
  slider.setAttribute('aria-valuetext', `Lucide ${position}%, Playglyph ${100 - position}%`);
  scene.querySelector('.label-lucide').hidden = position === 0;
  scene.querySelector('.label-playglyph').hidden = position === 100;
}
function updateFromPointer(event) {
  const bounds = scene.getBoundingClientRect();
  update((event.clientX - bounds.left) / bounds.width * 100);
}
scene.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  activePointer = event.pointerId;
  scene.setPointerCapture(activePointer);
  slider.focus({ preventScroll: true });
  updateFromPointer(event);
});
scene.addEventListener('pointermove', (event) => {
  if (event.pointerId === activePointer) updateFromPointer(event);
});
function stopDragging(event) {
  if (event.pointerId !== activePointer) return;
  if (scene.hasPointerCapture(activePointer)) scene.releasePointerCapture(activePointer);
  activePointer = null;
}
scene.addEventListener('pointerup', stopDragging);
scene.addEventListener('pointercancel', stopDragging);
scene.addEventListener('lostpointercapture', () => { activePointer = null; });
slider.addEventListener('keydown', (event) => {
  const step = event.shiftKey ? 10 : 1;
  const values = { ArrowLeft: position - step, ArrowDown: position - step, ArrowRight: position + step, ArrowUp: position + step, Home: 0, End: 100, PageDown: position - 10, PageUp: position + 10 };
  if (!(event.key in values)) return;
  event.preventDefault();
  update(values[event.key]);
});
