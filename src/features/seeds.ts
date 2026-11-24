import type { Seed, StarId } from '../types';
import { STARS, getStar } from '../data/stars';
import { getArticle } from '../data/articles';
import { isStarId, starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';
import { clearSeeds, loadSeeds, removeSeed, updateSeed } from '../lib/seedStore';
import { articleList, bindReadTracking } from './articleLinks';

/** 同じ星座がこの期間にこの回数以上なら「話して整理する」を案内する */
const REPEAT_DAYS = 14;
const REPEAT_COUNT = 3;

let filter: StarId | null = null;

const fmt = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit',
});

function countByStar(seeds: readonly Seed[]): Map<StarId, number> {
  const m = new Map<StarId, number>();
  seeds.forEach((s) => m.set(s.star, (m.get(s.star) ?? 0) + 1));
  return m;
}

function starMap(seeds: readonly Seed[]): string {
  const counts = countByStar(seeds);
  const max = Math.max(0, ...counts.values());
  const all = `<button type="button" class="sm-all" data-filter="" aria-pressed="${filter === null}">すべて<b>${seeds.length}</b></button>`;
  return `<div class="sm-grid" role="group" aria-label="星座で絞り込む">${all}${STARS.map((s) => {
    const n = counts.get(s.id) ?? 0;
    const cls = ['sm', n === 0 ? 'zero' : '', n > 0 && n === max ? 'top' : ''].filter(Boolean).join(' ');
    return `<button type="button" class="${cls}" data-filter="${s.id}" aria-pressed="${filter === s.id}"${n === 0 ? ' disabled' : ''}>` +
      `${starIcon(s.id)}<span>${esc(s.name)}</span><b>${n}</b></button>`;
  }).join('')}</div>`;
}

function repeatNotice(seeds: readonly Seed[]): string {
  const since = Date.now() - REPEAT_DAYS * 86_400_000;
  const counts = countByStar(seeds.filter((s) => Date.parse(s.at) >= since));
  const hit = STARS.find((s) => (counts.get(s.id) ?? 0) >= REPEAT_COUNT);
  if (!hit) return '';
  return `<div class="cta-box"><span class="mono">PR｜話して整理したいときに</span>` +
    `<h4>この${REPEAT_DAYS}日で、${esc(hit.name)}の星座の悩みを${counts.get(hit.id)}回吐き出しています</h4>` +
    `<p class="muted">同じ悩みが続くのは、それだけ大切にしていることだからです。書いても整理しきれないときは、利害関係のない相手に話してみる方法もあります。</p>` +
    `<a class="btn brass" href="#pillar/${hit.id}">話して整理する方法を見る</a><small>料金・特典は各公式サイトで最新情報をご確認ください。</small></div>`;
}

function seedCard(seed: Seed): string {
  const s = getStar(seed.star);
  const shown = seed.shown.map(getArticle).filter((a): a is NonNullable<typeof a> => a !== undefined);
  const chips = [
    ...seed.tags.map((t) => `<span class="chip brass">${esc(t)}</span>`),
    ...seed.matched.map((t) => `<span class="chip">${esc(t)}</span>`),
  ].join('');
  return `<article class="seed">` +
    `<header>${starIcon(seed.star)}<div><b>${esc(s.name)}の星座</b><span>${esc(s.view)}</span></div>` +
    `<time datetime="${esc(seed.at)}">${fmt.format(new Date(seed.at))}</time></header>` +
    (chips ? `<div class="seed-row"><span class="mono">キーワード</span><div class="chips">${chips}</div></div>` : '') +
    `<div class="seed-row"><span class="mono">表示した記事</span><div>${shown.length ? articleList(shown, seed.id, seed.read) : '<p class="muted">表示した記事はありません</p>'}</div></div>` +
    `<div class="seed-row"><span class="mono">今日の実験</span><label class="exp-check"><input type="checkbox" data-exp="${seed.id}"${seed.experimentDone ? ' checked' : ''}><span>${esc(s.experiment)}</span></label></div>` +
    `<footer><a href="#pillar/${s.id}">${esc(s.name)}の星座ページ</a><button type="button" class="linkbtn" data-del="${seed.id}">この種を消す</button></footer>` +
    `</article>`;
}

export function renderSeeds(): void {
  const root = byId('seeds-root');
  const seeds = loadSeeds();
  if (filter && !seeds.some((s) => s.star === filter)) filter = null;

  if (seeds.length === 0) {
    root.innerHTML = `<div class="seeds-empty">${starIcon('hoshi')}<h2>まだ種はありません</h2>` +
      `<p>トップの吐き出しノートで書くと、そのときの星座とキーワード、表示した記事がここに残ります。文章は残りません。</p>` +
      `<a class="btn" href="#site">吐き出しノートへ</a></div>`;
    return;
  }

  const list = filter ? seeds.filter((s) => s.star === filter) : seeds;
  root.innerHTML =
    `<section class="seeds-sec"><h2>あなたの星図</h2><p class="muted">どの星座で悩みやすいかを、吐き出した回数で表しています。押すと絞り込めます。</p>${starMap(seeds)}</section>` +
    repeatNotice(seeds) +
    `<section class="seeds-sec"><h2>種の一覧<span class="muted">${list.length}件</span></h2><div class="seed-list">${list.map(seedCard).join('')}</div></section>` +
    `<div class="seeds-foot"><button type="button" class="linkbtn" id="seeds-clear">すべての種を消す</button></div>`;
}

export function initSeeds(): void {
  const root = byId('seeds-root');
  bindReadTracking(root);

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const f = t.closest<HTMLButtonElement>('[data-filter]');
    if (f) {
      const id = f.dataset.filter;
      filter = isStarId(id) ? id : null;
      renderSeeds();
      return;
    }
    const del = t.closest<HTMLButtonElement>('[data-del]');
    if (del?.dataset.del) {
      if (window.confirm('この種を消しますか？元に戻せません。')) {
        removeSeed(del.dataset.del);
        renderSeeds();
      }
      return;
    }
    if (t.closest('#seeds-clear') && window.confirm('すべての種を消しますか？元に戻せません。')) {
      clearSeeds();
      filter = null;
      renderSeeds();
    }
  });

  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    const id = t.dataset.exp;
    if (id) updateSeed(id, (s) => ({ ...s, experimentDone: t.checked }));
  });
}
