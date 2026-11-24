import type { Article } from '../types';
import { articleHref, articleNo, isPublished } from '../data/articles';
import { getStar } from '../data/stars';
import { starIcon } from '../data/icons';
import { esc } from '../lib/dom';
import { markRead } from '../lib/seedStore';

/** 記事リスト。seedId があればクリック時に「読んだ」を記録する */
export function articleList(articles: readonly Article[], seedId: string | null, read: readonly string[] = []): string {
  if (articles.length === 0) return '';
  return `<ul class="a-list">${articles.map((a) => {
    const s = getStar(a.star);
    const done = read.includes(a.id);
    return `<li><a href="${articleHref(a)}" data-article="${a.id}"${seedId ? ` data-seed="${seedId}"` : ''}>` +
      `${starIcon(a.star)}<span class="a-body"><span class="a-meta">${esc(s.name)}の星座 ・ ${articleNo(a)}` +
      `${isPublished(a) ? '' : ' ・ 準備中'}${done ? ' ・ <span class="a-read">読んだ</span>' : ''}</span>` +
      `<span class="a-title">${esc(a.title)}</span></span></a></li>`;
  }).join('')}</ul>`;
}

/** 記事リンクのクリックで既読を記録（委譲） */
export function bindReadTracking(root: HTMLElement): void {
  root.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[data-article][data-seed]');
    const { seed, article } = a?.dataset ?? {};
    if (seed && article) markRead(seed, article);
  });
}
