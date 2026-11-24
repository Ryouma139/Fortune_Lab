import type { PillarDetail, Season, Star, StarId, WorkBlock } from '../types';
import { STARS, getBirthStar, getStar, isMonth } from '../data/stars';
import { loadBirthMonth, saveBirthMonth } from '../lib/birthStore';
import { weekGrid } from './weekGrid';
import { getPillar, hasDetailedPillar } from '../data/pillars';
import { articleHref, articlesOf, getArticleIn } from '../data/articles';
import { iconSvg, starIcon } from '../data/icons';
import { byId, esc, scrollToSection } from '../lib/dom';
import { articleList } from './articleLinks';

/*
 * 星座ページの表示だけを担当する。中身は src/stars/<id>/ にある。
 *   #pillar        → 一覧
 *   #pillar/<id>   → pillar.ts があれば詳細版、無ければ star.ts からテンプレ版
 */

const SEASONS: readonly { season: Season; months: readonly number[]; note: string }[] = [
  { season: '春', months: [3, 4, 5], note: '出会いと芽吹きの季節' },
  { season: '夏', months: [6, 7, 8], note: '休んで、広がる季節' },
  { season: '秋', months: [9, 10, 11], note: '見つめ、実る季節' },
  { season: '冬', months: [12, 1, 2], note: '流れを振り返り、根を張る季節' },
];

/** 設計メモ（星座ページ共通） */
const NOTES = {
  template: '12星座共通のテンプレ版。src/stars/<id>/star.ts から自動で組み立てる。src/stars/<id>/pillar.ts を置くと詳細版に切り替わる（見本は森の星座）。',
  firstView: 'ヒーロー直下に吐き出し欄。広告はファーストビューに置かない。目次はPCで左に追従、スマホでは2列の一覧。',
  brand: '星座の由来を図で見せる部分は12星座で共通のパーツ。pillar.ts の why.figure で図だけ差し替える。',
  cluster: '各悩みは開閉式。開くと星座の声・クセ・実験と、同じ星座フォルダの記事へのリンク。ピラーから記事へ内部リンクを集める役割。',
  work: '自己分析パートは読むだけでなく「選ぶ・チェックする」操作を入れる。結果は保存しない。差別化の中心なので図解を多めに。',
  week: '今日の曜日を強調表示。Phase 2でこのリストをPDF化し、LINE登録の特典にする。',
  cta: 'ピラーのPR枠はここ1か所（サイドの追従なし）。読み物としての信頼を優先し、ASP直リンクは置かない。',
} as const;

const pillarHref = (id: StarId): string => `#pillar/${id}`;
const note = (key: keyof typeof NOTES): string => `<div class="note"><b>${key.toUpperCase()}</b>${esc(NOTES[key])}</div>`;

let notesOn = true;
/** 表示中の詳細版（ワークの操作で参照する） */
let current: PillarDetail | undefined;

/* =====================================================================
 * 一覧（#pillar）
 * ===================================================================== */

function indexCard(s: Star): string {
  const detailed = hasDetailedPillar(s.id);
  return `<a class="s-card" href="${pillarHref(s.id)}" data-id="${s.id}">` +
    `<span class="s-top">${starIcon(s.id)}<span class="mono">${s.month}月</span>` +
    `<span class="chip${detailed ? ' brass' : ''}">${detailed ? '詳細版' : 'テンプレ版'}</span></span>` +
    `<b>${esc(s.name)}の星座</b>` +
    `<span class="s-view">${esc(s.view)}</span>` +
    `<span class="s-worry">${esc(s.worry)}</span>` +
    `<span class="s-count">記事 ${articlesOf(s.id).length}本</span></a>`;
}

function renderIndex(): void {
  const byMonth = new Map(STARS.map((s) => [s.month as number, s]));
  byId('star-index').innerHTML = SEASONS.map(({ season, months, note: n }) => {
    const cards = months.map((m) => byMonth.get(m)).filter((s): s is Star => s !== undefined).map(indexCard).join('');
    return `<section class="s-season"><h2>${season}<span>${esc(n)}</span></h2><div class="s-grid">${cards}</div></section>`;
  }).join('');
}

function initIndexBirth(): void {
  const select = byId<HTMLSelectElement>('idx-bm');
  const out = byId('idx-bm-out');
  for (let m = 1; m <= 12; m++) {
    const o = document.createElement('option');
    o.value = String(m);
    o.textContent = `${m}月`;
    select.appendChild(o);
  }
  const apply = (): void => {
    const m = Number(select.value);
    const cards = document.querySelectorAll<HTMLAnchorElement>('#star-index .s-card');
    if (!isMonth(m)) {
      cards.forEach((c) => c.classList.remove('mine'));
      out.innerHTML = '';
      return;
    }
    const s = getBirthStar(m);
    cards.forEach((c) => c.classList.toggle('mine', c.dataset.id === s.id));
    out.innerHTML = `あなたの生まれ星座は <a href="${pillarHref(s.id)}">${esc(s.name)}の星座</a>`;
  };
  select.addEventListener('change', () => {
    const m = Number(select.value);
    saveBirthMonth(isMonth(m) ? m : null);
    apply();
  });
  const saved = loadBirthMonth();
  if (saved) {
    select.value = String(saved);
    apply();
  }
}

/* =====================================================================
 * 共通パーツ
 * ===================================================================== */

function hero(s: Star, headline: string, sub: string): string {
  return `<div class="p-hero"><div class="wrap"><div>` +
    `<p class="crumb"><a href="#site">ホーム</a> ＞ <a href="#pillar">12の星座</a> ＞ ${esc(s.name)}の星座</p>` +
    `<h1>【${esc(s.name)}の星座】${esc(headline).replace(/\n/g, '<br>')}</h1>` +
    `<p class="sub">${esc(sub)}</p>` +
    `<div class="chips"><span>${s.month}月の生まれ星座</span>${s.keywords.map((k) => `<span>${esc(k)}</span>`).join('')}</div>` +
    `</div>${starIcon(s.id, 'big')}</div></div>`;
}

function notesBar(): string {
  return `<div class="notes-bar"><label class="toggle-notes"><input type="checkbox" id="snotes"${notesOn ? ' checked' : ''}> 設計メモを表示</label></div>`;
}

function ventPad(s: Star, prompt: string, placeholder = ''): string {
  return `<div class="mini-pad"><p class="mono">吐き出しノート｜${esc(s.name)}の星座</p>` +
    `<label for="svent">${esc(prompt)}</label>` +
    `<textarea id="svent" placeholder="${esc(placeholder)}"></textarea>` +
    `<p class="fine">送信も保存もされません。書けたら、それだけで最初の一歩です。</p></div>`;
}

function profile(s: Star, experimentShort?: string): string {
  const cells: [string, string][] = [['観点', s.view], ['モチーフ', s.name], ['生まれ月', `${s.month}月`], ['キーワード', s.keywords.join('・')]];
  if (experimentShort) cells.push(['今日の実験', experimentShort]);
  return `<dl class="profile${cells.length === 4 ? ' profile-4' : ''}">${cells.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}

function why(s: Star, text: string, figure?: string): string {
  const fig = figure ? `<svg viewBox="0 0 120 70" aria-hidden="true">${figure}</svg>` : starIcon(s.id);
  return `<div class="why${figure ? '' : ' why-ico'}">${fig}<div><b>なぜ「${esc(s.name)}」なのか</b><p class="muted">${esc(text)}</p></div></div>` +
    `<p class="t small muted">${s.month}月生まれの人の<b>生まれ星座</b>であり、${esc(s.view)}に悩んでいる夜は誰にとっても<b>今夜の星座</b>になります。<a href="#self">今夜の星座診断</a>で確かめられます。</p>`;
}

function articlesBlock(s: Star): string {
  const list = articlesOf(s.id);
  return list.length ? articleList(list, null) : '<p class="t small muted">この星座の記事は準備中です。</p>';
}

function ctaBox(heading: string, points: readonly string[], s: Star): string {
  return `<div class="cta-box"><span class="mono">PR｜話して整理したい夜に</span><h4>${esc(heading)}</h4>` +
    (points.length ? `<ul>${points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '') +
    `<a class="btn brass" href="${pillarHref(s.id)}">電話占いの選び方を見る</a><small>料金・特典は各公式サイトで最新情報をご確認ください。</small></div>`;
}

function relLink(s: Star, text: string): string {
  return `<a href="${pillarHref(s.id)}">${starIcon(s.id)}<span><b>${esc(s.name)}の星座</b>${esc(text)}</span></a>`;
}

function faqBlock(extra: readonly { q: string; a: string }[]): string {
  const items = [
    { q: '12の星座は、普通の星座占いとは違うのですか？', a: 'はい。FORTUNE LABが「人が生きていくうえで大切な12の観点」から作った独自の星座です。' },
    ...extra,
  ];
  return `<dl class="faq">${items.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl>` +
    `<div class="safety-box">つらさが強いとき、眠れない日が続くときは、ひとりで抱えずに専門の相談窓口も頼ってください。<a href="https://www.mhlw.go.jp/mamorouyokokoro/" target="_blank" rel="noopener">厚生労働省「まもろうよ こころ」</a>で、電話やSNSで相談できる窓口を探せます。</div>` +
    `<div class="author"><div class="avatar">LAB</div><div><b>FORTUNE LAB 編集部</b><br><span class="muted">（執筆者・監修者の実際の経歴をここに記載）</span></div></div>`;
}

/** 前後の月の星座 */
function neighbors(s: Star): [Star, Star] {
  const prev = getBirthStar((((s.month + 10) % 12) + 1) as Star['month']);
  const next = getBirthStar(((s.month % 12) + 1) as Star['month']);
  return [prev, next];
}

/* =====================================================================
 * 詳細版（pillar.ts あり）
 * ===================================================================== */

interface Section { id: string; toc: string; title?: string; html: string }

function workBlock(b: WorkBlock, i: number): string {
  const head = `<h3 class="sub-h">${esc(b.heading)}</h3>`;
  switch (b.kind) {
    case 'scale':
      return head + `<div class="scale"><p>${esc(b.prompt)}</p>` +
        `<div class="scale-track" role="group" aria-label="${esc(b.heading)}">${b.levels.map((l, li) =>
          `<button type="button" data-scale="${i}" data-i="${li}" aria-pressed="${li === b.defaultIndex}"><span class="dots">${'<i></i>'.repeat(l.dots)}</span>${esc(l.label)}</button>`).join('')}</div>` +
        `<p class="scale-out" id="scale-out-${i}" aria-live="polite">${scaleText(b, b.defaultIndex)}</p></div>`;
    case 'checklist':
      return head + `<div class="signs">${b.items.map((t) => `<label><input type="checkbox" data-check="${i}">${esc(t)}</label>`).join('')}</div>` +
        `<p class="sign-out" id="check-out-${i}" aria-live="polite">${esc(b.zero)}</p>`;
    case 'cards':
      return head + `<div class="bounds">${b.items.map((t) => `<div>${esc(t)}</div>`).join('')}</div>`;
  }
}

function scaleText(b: Extract<WorkBlock, { kind: 'scale' }>, i: number): string {
  const l = b.levels[i];
  return l ? `<b>${esc(l.label)}</b>：${esc(l.desc)}。${esc(b.outro)}` : '';
}

function renderDetail(s: Star, p: PillarDetail): string {
  const sections: Section[] = [];

  sections.push({
    id: 'p-vent', toc: 'まず吐き出す',
    html: `<p class="t">${esc(p.intro)}<b>${esc(p.emphasis)}</b></p>` + ventPad(s, p.ventPrompt, p.ventPlaceholder) + note('firstView'),
  });
  sections.push({
    id: 'p-about', toc: `${s.name}の星座とは`, title: `${s.name}の星座とは`,
    html: profile(s, p.experimentShort) + why(s, p.why.text, p.why.figure) + note('brand'),
  });
  sections.push({
    id: 'p-two', toc: '強みとつまずき', title: `${s.name}の星座の人の強みと、つまずきやすいところ`,
    html: `<div class="two"><div class="panel"><h3>強み <small>表</small></h3><ul>${p.strengths.map((t) => `<li><b>${esc(t)}</b></li>`).join('')}</ul></div>` +
      `<div class="panel"><h3>つまずきやすいところ <small>裏</small></h3><ul>${p.stumbles.map((t) => `<li><b>${esc(t)}</b></li>`).join('')}</ul></div></div>` +
      `<p class="flip-note">${esc(p.flipNote)}</p>`,
  });
  sections.push({
    id: 'p-worries', toc: `あって当然の悩み${p.worries.length}つ`, title: `${s.name}の星座の「あって当然」の悩み${p.worries.length}つ`,
    html: `<div class="worries">${p.worries.map((w, i) => {
      const a = w.article ? getArticleIn(s.id, w.article) : undefined;
      return `<details class="worry"${i === 0 ? ' open' : ''}><summary><span><span class="mono">${String(i + 1).padStart(2, '0')}</span>${esc(w.title)}</span></summary>` +
        `<div class="wb"><div class="row"><span class="mono">星座の声</span><span>${esc(w.fortune)}</span></div>` +
        `<div class="row"><span class="mono">思考のクセ</span><span>${esc(w.habit)}</span></div>` +
        `<div class="row"><span class="mono">今日の実験</span><span class="exp">${esc(w.experiment)}</span></div>` +
        (a ? `<a href="${articleHref(a)}">詳しく読む：${esc(a.title)}</a>` : '') + `</div></details>`;
    }).join('')}</div>` + note('cluster'),
  });
  if (p.work) {
    sections.push({
      id: 'p-work', toc: p.work.toc ?? '自己分析ワーク', title: p.work.title,
      html: p.work.blocks.map(workBlock).join('') + note('work'),
    });
  }
  sections.push({
    id: 'p-week', toc: '1週間の実験', title: `${s.name}の星座の1週間の実験リスト`,
    html: `<p class="t small muted">どれも5分以内。気になったものを1つ選んで、できたらそれで成功です。</p>` +
      weekGrid(s) + note('week'),
  });
  sections.push({
    id: 'p-cta', toc: '話して整理する', title: '一人で整理しきれないとき',
    html: `<p class="t">書き出しても、気持ちがまとまらない夜もあります。それも自然なことです。身近な人には話しにくいことも、利害関係のない相手になら話しやすいことがあります。</p>` +
      ctaBox(p.cta.heading, p.cta.points, s) + note('cta'),
  });
  sections.push({
    id: 'p-articles', toc: '記事と関連する星座', title: `${s.name}の星座の記事と、一緒に読みたい星座`,
    html: `<div class="p-articles">${articlesBlock(s)}</div>` +
      `<div class="rel">${p.related.map((r) => relLink(getStar(r.star), r.why)).join('')}</div>`,
  });
  sections.push({ id: 'p-faq', toc: 'よくある質問', title: 'よくある質問', html: faqBlock(p.faq) });

  let n = 0;
  const main = sections.map((sec) =>
    `<section id="${sec.id}">${sec.title ? `<h2><span class="mono">${String(++n).padStart(2, '0')}</span>${esc(sec.title)}</h2>` : ''}${sec.html}</section>`).join('');
  const toc = `<nav class="p-toc" aria-label="目次"><span class="mono eyebrow">目次</span><ol>${sections.map((sec) =>
    `<li><a href="${pillarHref(s.id)}" data-pjump="${sec.id}">${esc(sec.toc)}</a></li>`).join('')}</ol></nav>`;

  return hero(s, p.headline, p.sub) +
    `<div class="wrap${notesOn ? ' show-notes' : ''}" id="star-body">${notesBar()}<div class="p-body">${toc}<div class="p-main">${main}</div></div></div>`;
}

/* =====================================================================
 * テンプレ版（star.ts だけ）
 * ===================================================================== */

function renderTemplate(s: Star): string {
  const [prev, next] = neighbors(s);
  const worries = s.worry.split('／');
  const label = `${s.name}の星座`;
  let n = 0;
  const h2 = (t: string): string => `<h2><span class="mono">${String(++n).padStart(2, '0')}</span>${esc(t)}</h2>`;

  return hero(s, `${s.view}の悩みとの付き合い方`,
    `「${worries[0] ?? s.worry}」。そう感じるのは、${s.view}を大切にしているから。星座の声・思考のクセ・今日の実験で、悩みとの付き合い方を紹介します。`) +
    `<div class="wrap t-wrap${notesOn ? ' show-notes' : ''}" id="star-body">${notesBar()}${note('template')}<div class="p-main">` +
    `<section><p class="t">${esc(s.worry)}。そう感じるのは、あなたが弱いからではありません。<b>悩みは、あって当然のものです。</b></p>` +
      ventPad(s, `いま「${s.view}」について気になっていることを、そのまま書いてみてください。`) + `</section>` +
    `<section>${h2(`${label}とは`)}${profile(s)}${why(s, s.origin)}</section>` +
    `<section>${h2(`${label}の「あって当然」の悩み`)}<ul class="w-list">${worries.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></section>` +
    `<section>${h2(`${label}からのメッセージ`)}<div class="reading"><h3>${starIcon(s.id)}${esc(label)}｜${esc(s.view)}</h3>` +
      `<div class="row"><span class="mono">星座の声</span><div>${esc(s.fortune)}</div></div>` +
      `<div class="row"><span class="mono">思考のクセ</span><div>${esc(s.habit)}</div></div>` +
      `<div class="row"><span class="mono">キーワード</span><div>${esc(s.keywords.join('・'))}</div></div></div></section>` +
    `<section>${h2('今日の実験')}<p class="t exp">${esc(s.experiment)}</p><p class="t small muted">5分以内でできることだけ。やってみたら、それで実験は成功です。</p></section>` +
    `<section>${h2(`${label}の1週間の実験`)}<p class="t small muted">どれも5分以内。気になったものを1つ選んで、できたらそれで成功です。</p>${weekGrid(s)}</section>` +
    `<section>${h2(`${label}の記事`)}${articlesBlock(s)}</section>` +
    `<section>${h2('一人で整理しきれないとき')}${ctaBox(`${s.view}の悩みを、匿名で、自宅から相談する`, [], s)}</section>` +
    `<section>${h2(`${label}と一緒に読みたい星座`)}<div class="rel">${relLink(prev, `${prev.view}が気になるときに`)}${relLink(next, `${next.view}が気になるときに`)}` +
      `<a href="#pillar">${iconSvg('<circle cx="20" cy="20" r="14"/><path d="M20 6v28M6 20h28"/>')}<span><b>12の星座一覧</b>ほかの星座も見てみる</span></a></div></section>` +
    `<section>${h2('よくある質問')}${faqBlock([])}</section>` +
    `</div></div>`;
}

/* =====================================================================
 * 入口
 * ===================================================================== */

export function renderStarPage(id: StarId): void {
  const s = getStar(id);
  current = getPillar(id);
  byId('star-page').innerHTML = current ? renderDetail(s, current) : renderTemplate(s);
  document.title = `${s.name}の星座｜FORTUNE LAB`;
}

export function initStarPages(): void {
  renderIndex();
  initIndexBirth();

  const page = byId('star-page');
  page.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'snotes') {
      notesOn = t.checked;
      byId('star-body').classList.toggle('show-notes', notesOn);
      return;
    }
    const ci = t.dataset.check;
    const block = ci !== undefined ? current?.work?.blocks[Number(ci)] : undefined;
    if (block?.kind === 'checklist') {
      const count = page.querySelectorAll<HTMLInputElement>(`input[data-check="${ci}"]:checked`).length;
      byId(`check-out-${ci}`).textContent = count === 0 ? block.zero : block.some.replace('{n}', String(count));
    }
  });

  page.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const jump = el.closest<HTMLAnchorElement>('[data-pjump]');
    if (jump?.dataset.pjump) {
      e.preventDefault();
      scrollToSection(jump.dataset.pjump);
      return;
    }
    const btn = el.closest<HTMLButtonElement>('[data-scale]');
    const si = btn?.dataset.scale;
    const block = si !== undefined ? current?.work?.blocks[Number(si)] : undefined;
    if (btn && block?.kind === 'scale') {
      const i = Number(btn.dataset.i);
      page.querySelectorAll<HTMLButtonElement>(`[data-scale="${si}"]`).forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      byId(`scale-out-${si}`).innerHTML = scaleText(block, i);
    }
  });
}
