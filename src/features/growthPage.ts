import type { StarId } from '../types';
import { STARS, getBirthStar, getStar } from '../data/stars';
import { loadBirthMonth } from '../lib/birthStore';
import { getPillar } from '../data/pillars';
import { articlesByKind } from '../data/articles';
import { isStarId, starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';
import { loadSeeds } from '../lib/seedStore';
import { articleList } from './articleLinks';
import { topSeedStar } from './selfPage';
import { weekGrid } from './weekGrid';

/*
 * 変わる（#growth）：気づいたことを5分の行動にする場所。
 *   1. 実験の記録（種の「やってみた」から集計。できた数だけを見せる）
 *   2. 今日の実験ライブラリ（star.ts の実験＋pillar.ts の悩み別の実験）
 *   3. 1週間の実験（生まれ星座を優先。star.ts の week。12星座から選べる）
 *   4. 変わる記事（kind: 'growth'）
 *   5. 続けても変わらないときの案内
 */

interface Experiment { star: StarId; text: string; source: string }

let libFilter: StarId | null = null;
let weekStar: StarId | null = null;

/** 星座ごとの実験を集める（重複する文は1つに） */
function collectExperiments(): Experiment[] {
  const list: Experiment[] = [];
  const seen = new Set<string>();
  const add = (e: Experiment): void => {
    const key = e.text.replace(/[、。「」\s]/g, '');
    if (seen.has(key)) return;
    seen.add(key);
    list.push(e);
  };
  for (const s of STARS) {
    add({ star: s.id, text: s.experiment, source: '星座の実験' });
    getPillar(s.id)?.worries.forEach((w) => add({ star: s.id, text: w.experiment, source: w.title }));
  }
  return list;
}

const EXPERIMENTS = collectExperiments();

/* ---------- 1. 実験の記録 ---------- */

function recordHtml(): string {
  const done = loadSeeds().filter((s) => s.experimentDone);
  if (done.length === 0) {
    return `<div class="map-empty"><p>まだ記録はありません。吐き出した後の「今日の実験」をやってみたら、<a href="#seeds">種の記録</a>で「やってみた」にチェックすると、ここに集まります。</p></div>`;
  }
  const now = new Date();
  const thisMonth = done.filter((s) => {
    const d = new Date(s.at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
  const fmt = new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' });
  return `<div class="rec-stats"><div><b>${thisMonth}</b><span>今月やってみた実験</span></div><div><b>${done.length}</b><span>これまでの合計</span></div></div>` +
    `<ul class="rec-list">${done.slice(0, 5).map((s) => {
      const st = getStar(s.star);
      return `<li>${starIcon(s.star)}<span class="mono">${fmt.format(new Date(s.at))}</span><span>${esc(st.experiment)}</span></li>`;
    }).join('')}</ul>` +
    `<p class="muted small">やってみたこと自体が成功です。できなかった日の数は数えません。</p>`;
}

/* ---------- 2. ライブラリ ---------- */

function libraryHtml(): string {
  const counts = new Map<StarId, number>();
  EXPERIMENTS.forEach((e) => counts.set(e.star, (counts.get(e.star) ?? 0) + 1));
  const filters = `<div class="al-filter" role="group" aria-label="星座で絞り込む">` +
    `<button type="button" data-lib="" aria-pressed="${libFilter === null}">すべて <b>${EXPERIMENTS.length}</b></button>` +
    STARS.map((s) => `<button type="button" data-lib="${s.id}" aria-pressed="${libFilter === s.id}">${starIcon(s.id)}${esc(s.name)} <b>${counts.get(s.id) ?? 0}</b></button>`).join('') +
    `</div>`;
  const items = EXPERIMENTS.filter((e) => !libFilter || e.star === libFilter);
  return filters + `<div class="lib-grid">${items.map((e) => {
    const s = getStar(e.star);
    return `<div class="lib-card"><div class="lib-top">${starIcon(e.star)}<a href="#pillar/${s.id}">${esc(s.name)}の星座</a><span class="chip">${esc(e.source)}</span></div><p>${esc(e.text)}</p></div>`;
  }).join('')}</div>`;
}

/* ---------- 3. 1週間の実験 ---------- */

/**
 * 表示する星座：タブで選んだ星座 → 生まれ星座（トップで選んだ生まれ月） → 今夜の星座（いちばん多い種） → 森。
 * 1週間の実験は各星座の star.ts の week。12星座すべてから選べる。
 */
function weekHtml(): string {
  const bm = loadBirthMonth();
  const birth = bm ? getBirthStar(bm) : null;
  const sel = getStar(weekStar ?? birth?.id ?? topSeedStar() ?? 'mori');
  const head = birth
    ? `<p class="muted small">あなたの生まれ星座は${starIcon(birth.id)}<a href="#pillar/${birth.id}">${esc(birth.name)}の星座</a>（${esc(birth.view)}）です。生まれ月は<a href="#site">トップの12の星座</a>で変えられます。</p>`
    : `<p class="muted small"><a href="#site">トップの12の星座</a>で生まれ月を選ぶと、あなたの生まれ星座の1週間が表示されます。</p>`;
  const tabs = `<div class="al-filter" role="group" aria-label="星座を選ぶ">${STARS.map((s) =>
    `<button type="button" data-week="${s.id}" aria-pressed="${s.id === sel.id}">${starIcon(s.id)}${esc(s.name)}${s.id === birth?.id ? '（生まれ星座）' : ''}</button>`).join('')}</div>`;
  return head + tabs +
    `<p class="muted small">${esc(sel.name)}の星座（${esc(sel.view)}）の1週間。どれも5分以内です。</p>` + weekGrid(sel);
}

/* ---------- 5. 続けても変わらないとき ---------- */

function talkHtml(): string {
  const top = topSeedStar();
  const s = top ? getStar(top) : undefined;
  return `<div class="cta-box"><span class="mono">PR｜話して整理したいときに</span>` +
    `<h4>続けても変わらないときは、話して整理する方法も</h4>` +
    `<p class="muted">実験を続けても気持ちが動かないのは、あなたのせいではありません。一人で抱えている時間が長いほど、言葉にしにくくなることがあります。</p>` +
    `<a class="btn brass" href="${s ? `#pillar/${s.id}` : '#pillar'}">電話占いの選び方を見る</a>` +
    `<small>料金・特典は各公式サイトで最新情報をご確認ください。</small></div>`;
}

/* ---------- 入口 ---------- */

function renderLibrary(): void { byId('growth-library').innerHTML = libraryHtml(); }
function renderWeek(): void { byId('growth-week').innerHTML = weekHtml(); }

export function initGrowthPage(): void {
  const arts = articlesByKind('growth');
  byId('growth-articles').innerHTML = arts.length ? articleList(arts, null) : '<p class="muted">準備中です。</p>';
  renderLibrary();

  byId('v-growth').addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const lib = el.closest<HTMLButtonElement>('[data-lib]');
    if (lib) {
      const id = lib.dataset.lib;
      libFilter = isStarId(id) ? id : null;
      renderLibrary();
      return;
    }
    const wk = el.closest<HTMLButtonElement>('[data-week]');
    if (wk && isStarId(wk.dataset.week)) {
      weekStar = wk.dataset.week;
      renderWeek();
    }
  });
}

/** 表示のたびに、種から集計する部分だけ更新 */
export function renderGrowthPage(): void {
  byId('growth-record').innerHTML = recordHtml();
  byId('growth-talk').innerHTML = talkHtml();
  weekStar = null; // 開くたびに生まれ星座から表示し直す
  renderWeek();
}
