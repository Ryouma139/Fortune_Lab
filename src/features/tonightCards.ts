import { STARS, getStar } from '../data/stars';
import { CARD_BACK_ICON, iconSvg, isStarId, starIcon } from '../data/icons';
import { byId, esc, shuffle } from '../lib/dom';

const LABELS = ['A', 'B', 'C'] as const;

/** 今夜の星座カード（3枚から1枚めくる） */
export function initTonightCards(): void {
  const cardsEl = byId('cards');
  const title = byId('d-title');
  const body = byId('d-body');
  let picked = false;

  const deal = (): void => {
    picked = false;
    const pool = shuffle(STARS).slice(0, LABELS.length);
    cardsEl.innerHTML = pool
      .map((s, i) => {
        const label = LABELS[i] ?? '';
        return `<button class="tcard" type="button" data-id="${s.id}" aria-label="カード${label}">` +
          `<span class="in">` +
          `<span class="back">${iconSvg(CARD_BACK_ICON)}<span class="mono">${label}</span></span>` +
          `<span class="face">${starIcon(s.id)}<b>${esc(s.name)}の星座</b><small>${esc(s.view)}</small></span>` +
          `</span></button>`;
      })
      .join('');
    title.textContent = 'カードを1枚選んでください';
    body.hidden = true;
  };

  cardsEl.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLButtonElement>('.tcard');
    if (!card || picked || !isStarId(card.dataset.id)) return;
    picked = true;
    const s = getStar(card.dataset.id);
    card.classList.add('flipped');
    card.setAttribute('aria-label', `${s.name}の星座`);
    cardsEl.querySelectorAll('.tcard').forEach((o) => {
      if (o !== card) o.classList.add('dim');
    });
    title.textContent = `${s.name}の星座｜${s.view}`;
    byId('d-f').textContent = s.fortune;
    byId('d-s').textContent = s.habit;
    byId('d-e').textContent = s.experiment;
    body.hidden = false;
  });

  byId('redraw').addEventListener('click', deal);
  deal();
}
