import { createIcons } from '../dist/lookup.js';

createIcons();
const theme = document.getElementById('theme');
theme.addEventListener('click', () => {
  const light = document.documentElement.dataset.theme !== 'light';
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  theme.textContent = light ? 'Dark' : 'Light';
});
const meta = await fetch(new URL('../dist/meta.json', import.meta.url)).then(r => r.json());
document.getElementById('icon-count').textContent = `${meta.length}개의 게임 UI 아이콘`;
