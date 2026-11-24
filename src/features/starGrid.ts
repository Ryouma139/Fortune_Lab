import type { Month, StarId } from '../types';
import { STARS, getBirthStar, getStar, isMonth } from '../data/stars';
import { isStarId, starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';
import { loadBirthMonth, saveBirthMonth } from '../lib/birthStore';

const DEFAULT_MONTH: Month = 5;

function row(label: string, value: string, valueClass = ''): string {
  return `<div class="row"><span class="mono">${label}</span><span${valueClass ? ` class="${valueClass}"` : ''}>${esc(value)}</span></div>`;
}

/** 12の星座グリッド＋生まれ月セレクト＋詳細パネル */
export function initStarGrid(): void {
  const starsEl = byId('stars');
  const detail = byId('detail');
  const select = byId<HTMLSelectElement>('bm');
  const birthOut = byId('bm-out');

  starsEl.innerHTML = STARS.map(
    (s) =>
      `<button class="star" type="button" data-id="${s.id}" aria-pressed="false">` +
      `<span class="top">${starIcon(s.id)}<span class="mono">${s.month}月</span></span>` +
      `<b>${esc(s.name)}の星座</b><span>${esc(s.view)}</span></button>`,
  ).join('');

  const show = (id: StarId): void => {
    const s = getStar(id);
    starsEl.querySelectorAll<HTMLButtonElement>('.star').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
    });
    detail.innerHTML =
      `<div class="head">${starIcon(id)}<div><p class="mono eyebrow">${s.month}月生まれ ／ ${esc(s.view)}</p><h3>${esc(s.name)}の星座</h3></div></div>` +
      `<div class="kw">${s.keywords.map((k) => `<span class="chip">${esc(k)}</span>`).join('')}</div>` +
      `<p class="origin">${esc(s.origin)}</p>` +
      row('あって当然', s.worry) +
      row('星座の声', s.fortune) +
      row('思考のクセ', s.habit) +
      row('今日の実験', s.experiment, 'exp') +
      `<p class="more"><a href="#pillar/${s.id}">${esc(s.name)}の星座ページを読む</a></p>`;
  };

  starsEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.star');
    if (b && isStarId(b.dataset.id)) show(b.dataset.id);
  });

  for (let m = 1; m <= 12; m++) {
    const o = document.createElement('option');
    o.value = String(m);
    o.textContent = `${m}月`;
    select.appendChild(o);
  }

  const setBirth = (): void => {
    const m = Number(select.value);
    if (!isMonth(m)) return;
    const s = getBirthStar(m);
    starsEl.querySelectorAll<HTMLButtonElement>('.star').forEach((b) => {
      b.classList.toggle('mine', b.dataset.id === s.id);
    });
    birthOut.textContent = `あなたの生まれ星座は「${s.name}の星座」`;
    show(s.id);
  };

  select.value = String(loadBirthMonth() ?? DEFAULT_MONTH);
  select.addEventListener('change', () => {
    const m = Number(select.value);
    if (isMonth(m)) saveBirthMonth(m);
    setBirth();
  });
  setBirth();
}
