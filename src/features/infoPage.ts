import type { InfoContact, InfoPage, InfoSection } from '../types';
import { footerPages, getInfoPage } from '../data/pages';
import { byId, esc } from '../lib/dom';

/*
 * 運営・ポリシー系ページ（#about など）。中身は src/pages/<id>.ts。
 * フッター（全ページ共通）からのみリンクし、トップには中身を出さない。
 */

const telHref = (n: string): string => `tel:${n.replace(/[^\d#]/g, '')}`;

function contact(c: InfoContact): string {
  return `<li class="contact"><div class="c-name">${esc(c.name)}</div>` +
    (c.number ? `<a class="c-num" href="${telHref(c.number)}">${esc(c.number)}</a>` : '') +
    `<p>${esc(c.note)}</p>` +
    (c.url ? `<a class="c-url" href="${esc(c.url)}" target="_blank" rel="noopener">公式サイト</a>` : '') +
    `</li>`;
}

function section(s: InfoSection, i: number): string {
  return `<section class="info-sec" id="info-${i}"><h2>${esc(s.heading)}</h2>` +
    (s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('') +
    (s.list ? `<ul>${s.list.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '') +
    (s.table ? `<dl class="info-table">${s.table.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '') +
    (s.contacts ? `<ul class="contacts">${s.contacts.map(contact).join('')}</ul>` : '') +
    (s.after ?? []).map((p) => `<p>${esc(p)}</p>`).join('') +
    (s.links ? `<p class="info-links">${s.links.map((l) => `<a href="${esc(l.href)}">${esc(l.label)}</a>`).join('')}</p>` : '') +
    `</section>`;
}

function pageHtml(p: InfoPage): string {
  const others = footerPages().filter((x) => x.id !== p.id);
  return `<div class="info">` +
    `<p class="crumb"><a href="#site">ホーム</a> ＞ ${esc(p.title)}</p>` +
    `<p class="mono eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.title)}</h1>` +
    `<p class="info-lead">${esc(p.lead)}</p>` +
    (p.draftNote ? `<p class="info-draft"><b>例文</b>${esc(p.draftNote)}</p>` : '') +
    p.sections.map(section).join('') +
    `<p class="info-updated">最終更新日：${esc(p.updated.replace(/-/g, '.'))}</p>` +
    `<nav class="info-others" aria-label="ほかのページ">${others.map((x) => `<a href="#${x.id}">${esc(x.title)}</a>`).join('')}</nav>` +
    `</div>`;
}

export function renderInfoPage(id: string): void {
  const p = getInfoPage(id);
  byId('info-root').innerHTML = p ? pageHtml(p) : '';
  if (p) document.title = `${p.title}｜FORTUNE LAB`;
}

/** 全ページ共通のフッターリンク */
export function renderFooterLinks(): void {
  byId('foot-links').innerHTML = footerPages().map((p) => `<a href="#${p.id}">${esc(p.title)}</a>`).join('');
}
