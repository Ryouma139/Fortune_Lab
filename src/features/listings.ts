import { ARTICLES, articleHref, articleNo } from '../data/articles';
import { STARS, getStar } from '../data/stars';
import { starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';

const POSTS_ON_TOP = 6;

function chipClass(tag: string): string {
  if (tag === 'PR') return 'chip warn';
  if (tag.includes('実験') || tag.includes('吐き出し')) return 'chip brass';
  return 'chip';
}

/** トップの新着 LAB NOTE */
export function renderPosts(): void {
  byId('posts').innerHTML = ARTICLES.slice(0, POSTS_ON_TOP).map((p) => {
    const s = getStar(p.star);
    return `<a class="post" href="${articleHref(p)}">` +
      `<div class="thumb"><span class="no">${articleNo(p)}</span><span class="k">${esc(s.name)}</span>${starIcon(p.star)}</div>` +
      `<div class="meta">${[`${s.name}の星座`, ...p.tags].map((t) => `<span class="${chipClass(t)}">${esc(t)}</span>`).join('')}</div>` +
      `<h3>${esc(p.title)}</h3></a>`;
  }).join('');
}

/** 設計書の12星座表 */
export function renderBlueprintTable(): void {
  byId('bp-stars').innerHTML = STARS.map(
    (s) =>
      `<tr><td class="num">${s.month}月</td><td><b>${starIcon(s.id)}${esc(s.name)}</b></td>` +
      `<td>${esc(s.view)}</td><td>${esc(s.origin)}</td><td>${esc(s.keywords.join('・'))}</td>` +
      `<td>${esc(s.worry)}</td><td>${esc(s.experiment)}</td></tr>`,
  ).join('');
}
