import type { Seed, StarId } from '../types';
import { VENT_CATEGORIES, getStar } from '../data/stars';
import { isStarId } from '../data/icons';
import { byId, esc } from '../lib/dom';
import { addSeed, newSeedId } from '../lib/seedStore';
import { matchVent } from './matcher';
import { articleList, bindReadTracking } from './articleLinks';

const RELEASE_MS = 900;

/**
 * トップの吐き出しノート。
 * 文章はブラウザ内で照合に使うだけで、送信も保存もしない。
 * 記録（種）に残すのは星座・キーワード・表示した記事だけ。
 */
export function initVentNote(): void {
  const catsEl = byId('cats');
  const ta = byId<HTMLTextAreaElement>('vent');
  const count = byId('count');
  const go = byId<HTMLButtonElement>('vent-go');
  const keep = byId<HTMLInputElement>('vent-keep');
  const reply = byId('reply');
  const releaseBtn = byId<HTMLButtonElement>('release');

  const selected = new Set<StarId>();
  /** 同じ文章で二重に種を作らない */
  let vented = false;

  for (const c of VENT_CATEGORIES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat';
    b.textContent = c.label;
    b.dataset.id = c.star;
    b.setAttribute('aria-pressed', 'false');
    catsEl.appendChild(b);
  }
  catsEl.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('.cat');
    const id = b?.dataset.id;
    if (!b || !isStarId(id)) return;
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    b.setAttribute('aria-pressed', String(selected.has(id)));
    vented = false;
    update();
  });

  const length = (): number => ta.value.trim().length;
  function update(): void {
    const n = length();
    count.textContent = `${n}文字`;
    go.disabled = n === 0 || vented;
  }
  ta.addEventListener('input', () => { vented = false; update(); });
  update();

  bindReadTracking(reply);

  go.addEventListener('click', () => {
    const n = length();
    if (!n || vented) return;
    const tags = VENT_CATEGORIES.filter((c) => selected.has(c.star)).map((c) => c.label);
    const r = matchVent(ta.value, [...selected]);
    const s = getStar(r.star);

    let seedId: string | null = null;
    let seedMsg: string;
    if (keep.checked) {
      const seed: Seed = {
        id: newSeedId(),
        at: new Date().toISOString(),
        star: r.star,
        tags,
        matched: r.matched,
        shown: r.articles.map((a) => a.id),
        read: [],
        experimentDone: false,
      };
      if (addSeed(seed)) {
        seedId = seed.id;
        seedMsg = `種として記録しました（文章は記録していません）。<a href="#seeds">種の記録を見る</a>`;
      } else {
        seedMsg = 'このブラウザでは記録できませんでした。保存が無効になっている可能性があります。';
      }
    } else {
      seedMsg = '今回は記録していません。';
    }

    byId('rp-alert').hidden = !r.crisis;
    byId('rp-title').textContent = `今夜の星座は、${s.name}の星座｜${s.view}`;
    byId('rp-accept').textContent =
      `書き出してくれてありがとう。${n}文字ぶんの気持ちを、ここに置いていけます。こう感じるのは、ちゃんと向き合っている証拠です。`;
    byId('rp-f').textContent = s.fortune;
    byId('rp-s').textContent = s.habit;
    byId('rp-e').textContent = s.experiment;
    byId('rp-articles').innerHTML = r.articles.length
      ? articleList(r.articles, seedId)
      : `<p class="a-empty">この悩みに近い記事は準備中です。まずは<a href="#pillar/${s.id}">${esc(s.name)}の星座ページ</a>へ。</p>`;
    const pillarLink = byId<HTMLAnchorElement>('rp-pillar');
    pillarLink.href = `#pillar/${s.id}`;
    pillarLink.textContent = `${s.name}の星座ページへ`;
    byId('rp-seed').innerHTML = seedMsg;
    reply.hidden = false;
    vented = true;
    update();
  });

  releaseBtn.addEventListener('click', () => {
    releaseBtn.disabled = true;
    ta.classList.add('release');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.setTimeout(() => {
      ta.value = '';
      ta.classList.remove('release');
      ta.placeholder = '流しました。また書きたくなったら、いつでもどうぞ。';
      vented = false;
      update();
      reply.hidden = true;
      releaseBtn.disabled = false;
    }, reduced ? 0 : RELEASE_MS);
  });
}
