// Original static 2D web-game scene for the landing-page icon comparison.
// Run with: node scripts/draw-demo-scene.mjs
import { writeFile, mkdir } from 'node:fs/promises';

let seed = 71;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const use = (id, x, y, scale = 1) => `<use href="#${id}" transform="translate(${x} ${y}) scale(${scale})"/>`;
const tiles = [];
for (let y = 0; y < 720; y += 40) {
  for (let x = 0; x < 1280; x += 40) {
    tiles.push(`<rect x="${x}" y="${y}" width="40" height="40" fill="${['#78a956','#7bad59','#7fae5a','#75a452'][Math.floor(random() * 4)]}"/>`);
    if (random() > .55) tiles.push(`<path d="m${x + 12} ${y + 26}-2-5m4 5 3-4" stroke="#639647" stroke-width="3" fill="none"/>`);
  }
}
const trees = [[40,130,1.3],[170,130,1.2],[290,120,1.3],[440,100,1.1],[575,100,1.3],[750,115,1.2],[915,120,1.3],[1060,110,1.3],[1220,140,1.5],[-20,320,1.35],[100,320,1.1],[200,360,.9],[40,520,1.2],[160,630,1.2],[270,700,1.25],[420,720,1.2],[1190,330,1.3],[1250,510,1.3],[1150,680,1.25],[1000,735,1.2]];
const props = [use('rock',285,445),use('rock',850,275,.8),use('rock',990,535,1.2),use('rock',330,595,.6),use('bush',350,250),use('bush',920,210),use('bush',1080,440),use('bush',255,540),use('bush',825,630)];
for (const [x,y] of [[330,355],[420,480],[735,285],[885,445],[1030,380],[180,460],[740,560],[510,235]]) props.push(use('flower',x,y));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
<defs>
  <g id="tree"><ellipse cy="35" rx="44" ry="15" fill="#355c35" opacity=".25"/><rect x="-9" y="-6" width="18" height="43" rx="3" fill="#765238"/><path d="M0-91C-25-91-48-67-43-46-64-29-48 1-27 3-21 20 17 20 29 3 55 0 59-31 39-44 45-67 25-91 0-91" fill="#315e3e" stroke="#294e35" stroke-width="4"/><path d="M-5-84C-32-79-40-61-34-47-51-30-39-12-20-10-5-23 13-12 26-21 45-28 36-51 24-55 24-73 8-85-5-84" fill="#4b8550"/><path d="M-16-68q-20 11-15 26m35-34q15 2 20 14" stroke="#68a35b" stroke-width="8" stroke-linecap="round" fill="none"/></g>
  <g id="rock"><ellipse cy="9" rx="28" ry="10" fill="#355c35" opacity=".2"/><path d="m-27 6 8-27 27-7 20 19-5 20-35 4Z" fill="#777e79" stroke="#586560" stroke-width="3"/><path d="m-18-18 24-6 12 12-26 3Z" fill="#a1aba0"/></g>
  <g id="bush"><ellipse cy="8" rx="30" ry="10" fill="#355c35" opacity=".2"/><path d="M-28 4c-14-19 3-36 17-28C-3-44 24-34 23-20 44-10 33 12 15 12h-28Z" fill="#4c803e"/><circle cx="-9" cy="-13" r="5" fill="#e5ad67"/><circle cx="14" cy="-10" r="4" fill="#ebc778"/></g>
  <g id="flower"><path d="M0 5v-12" stroke="#467a40" stroke-width="3"/><circle cy="-12" r="7" fill="#eee2a7"/><circle cy="-12" r="3" fill="#e9a748"/></g>
  <g id="slime"><ellipse cy="18" rx="29" ry="11" fill="#355c35" opacity=".24"/><path d="M-26 10C-26-29 24-29 28 10q-2 14-27 14t-27-14" fill="#91cf81" stroke="#436d4e" stroke-width="4"/><path d="M-18-3q5-13 16-13" stroke="#d4f2a4" stroke-width="6" stroke-linecap="round"/><path d="M-7 4v6M10 4v6" stroke="#304e43" stroke-width="4" stroke-linecap="round"/></g>
  <g id="coin"><ellipse cy="10" rx="12" ry="5" fill="#6a7635" opacity=".28"/><ellipse rx="10" ry="13" fill="#efbd4e" stroke="#b68132" stroke-width="3"/><path d="M-2-7v13" stroke="#ffe99e" stroke-width="3" stroke-linecap="round"/></g>
</defs>
${tiles.join('')}
<!-- A winding dirt path through the clearing. -->
<path d="M-50 470H370V390H720V320H1030V200H1330" fill="none" stroke="#648e46" stroke-width="136" stroke-linejoin="round"/>
<path d="M-50 470H370V390H720V320H1030V200H1330" fill="none" stroke="#c6ae75" stroke-width="114" stroke-linejoin="round"/>
<path d="M-50 440H350V360H700V290H1010V170H1330" fill="none" stroke="#d1ba83" stroke-width="14" stroke-linejoin="round" opacity=".6"/>
<g fill="#ad965f" opacity=".6"><rect x="303" y="418" width="10" height="5" rx="2"/><rect x="475" y="407" width="9" height="5" rx="2"/><rect x="804" y="342" width="10" height="5" rx="2"/><rect x="935" y="305" width="12" height="5" rx="2"/><rect x="1005" y="249" width="8" height="5" rx="2"/></g>
<!-- Pond and wooden bridge. -->
<path d="M1000 470h150v30h90v120h-45v55h-180v-40h-70V525h55Z" fill="#598b4a"/>
<path d="M1006 482h130v30h88v95h-44v52h-151v-40h-68v-80h45Z" fill="#5ca6a4" stroke="#91c4a3" stroke-width="7"/>
<path d="M1040 535h46m50 40h45m-150 13h38m29 43h37" stroke="#9bd2be" stroke-width="5" stroke-linecap="round"/>
${props.join('')}
${trees.map(t=>use('tree',...t)).join('')}
${[[650,370],[695,350],[743,335],[790,325]].map(p=>use('coin',...p)).join('')}
${use('slime',760,440)}${use('slime',900,325,.82)}${use('slime',420,280,.8)}
<!-- Tiny adventurer, drawn as a readable 2D sprite. -->
<g transform="translate(545 374)"><ellipse cy="39" rx="28" ry="11" fill="#485b38" opacity=".3"/><rect x="-18" y="23" width="14" height="18" rx="5" fill="#3e4750"/><rect x="6" y="23" width="14" height="18" rx="5" fill="#3e4750"/><rect x="-23" y="-4" width="46" height="34" rx="12" fill="#607eb1" stroke="#334e71" stroke-width="4"/><path d="M-14 0v25M14 0v25" stroke="#94afd2" stroke-width="4"/><rect x="-22" y="-37" width="44" height="39" rx="12" fill="#f0cf99" stroke="#654f40" stroke-width="4"/><path d="M-24-23v-14q3-23 26-20 25 1 24 24v14l-13-14-7 9-12-7-18 8" fill="#6b4c3e"/><path d="M-8-17v5M10-17v5" stroke="#443f40" stroke-width="4" stroke-linecap="round"/><path d="m19 12 24-26" stroke="#354e68" stroke-width="8"/><path d="m31-7 20-27 6 6-20 27Z" fill="#ecf0df" stroke="#738d91" stroke-width="3"/><path d="m28-8 13 10" stroke="#e8bf65" stroke-width="5"/><rect x="-29" y="8" width="14" height="16" rx="6" fill="#e9bf8a"/></g>
<!-- A chest and a signpost finish the little level. -->
<g transform="translate(865 190)"><ellipse cy="31" rx="35" ry="10" fill="#355c35" opacity=".25"/><rect x="-29" y="-8" width="58" height="40" rx="6" fill="#96623c" stroke="#5e4935" stroke-width="4"/><path d="M-29 6v-13q0-18 17-18h24q17 0 17 18V6Z" fill="#c78a45" stroke="#5e4935" stroke-width="4"/><path d="M-17-20v49m34-49v49" stroke="#e7ba57" stroke-width="7"/><rect x="-6" y="0" width="12" height="13" rx="2" fill="#f3d479"/></g>
<g transform="translate(340 320)"><path d="M0-20v39" stroke="#745438" stroke-width="8"/><path d="M-24-38H18l15 13-15 13h-42Z" fill="#b88850" stroke="#795b3a" stroke-width="3"/><path d="M-12-25h27m-6-5 6 5-6 5" stroke="#f1d59a" stroke-width="3" fill="none"/></g>
</svg>`;
await mkdir(new URL('../site/', import.meta.url), { recursive: true });
await writeFile(new URL('../site/game-2d.svg', import.meta.url), svg);
console.log('Created site/game-2d.svg (original 2D demo scene)');
