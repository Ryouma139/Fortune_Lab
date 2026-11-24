import type { Star, StarId } from '../types';
import { STARS } from '../data/stars';
import { articlesByKind, articlesOf } from '../data/articles';
import { starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';
import { loadSeeds } from '../lib/seedStore';
import { articleList } from './articleLinks';

/*
 * 知る（#self）：自分のパターンに気づく場所。
 *   1. 今夜の星座診断（12問。質問は各星座の star.ts の question）
 *   2. 思考のクセ一覧
 *   3. あなたの星図（種の記録から集計）
 *   4. 知る記事（kind: 'self'）
 */

const ANSWERS = [
  { label: '当てはまる', score: 2 },
  { label: '少し', score: 1 },
  { label: '当てはまらない', score: 0 },
] as const;

/* ---------- 1. 診断 ---------- */

function quizHtml(): string {
  return `<form class="quiz" id="quiz">` +
    STARS.map((s, i) =>
      `<fieldset class="q"><legend><span class="mono">Q${i + 1}</span>${esc(s.question)}</legend><div class="q-opts">` +
      ANSWERS.map((a) => `<label><input type="radio" name="q-${s.id}" value="${a.score}"><span>${a.label}</span></label>`).join('') +
      `</div></fieldset>`).join('') +
    `<div class="quiz-foot"><span id="quiz-progress" aria-live="polite">0 / ${STARS.length}</span>` +
    `<button type="reset" class="linkbtn">はじめからやり直す</button>` +
    `<button type="submit" class="btn" id="quiz-go" disabled>結果を見る</button></div>` +
    `</form><div class="quiz-result" id="quiz-result" aria-live="polite" hidden></div>`;
}

function resultHtml(top: Star, second: Star | undefined): string {
  const art = articlesOf(top.id).slice(0, 3);
  return `<p class="mono eyebrow">あなたの今夜の星座</p>` +
    `<div class="qr-head">${starIcon(top.id)}<div><h3>${esc(top.name)}の星座</h3><p class="muted">${esc(top.view)}がいちばん揺れているようです</p></div></div>` +
    `<div class="row"><span class="mono">星座の声</span><span>${esc(top.fortune)}</span></div>` +
    `<div class="row"><span class="mono">思考のクセ</span><span>${esc(top.habit)}</span></div>` +
    `<div class="row"><span class="mono">今日の実験</span><span class="exp">${esc(top.experiment)}</span></div>` +
    (second ? `<p class="qr-second">次に揺れているのは <a href="#pillar/${second.id}">${esc(second.name)}の星座（${esc(second.view)}）</a> です。</p>` : '') +
    (art.length ? `<div class="qr-articles"><p class="mono">${esc(top.name)}の星座の記事</p>${articleList(art, null)}</div>` : '') +
    `<p class="qr-acts"><a class="btn" href="#pillar/${top.id}">${esc(top.name)}の星座ページへ</a></p>` +
    `<p class="fine muted">回答は保存されません。結果は「いま」の状態なので、日によって変わって大丈夫です。</p>`;
}

function initQuiz(): void {
  const form = byId<HTMLFormElement>('quiz');
  const go = byId<HTMLButtonElement>('quiz-go');
  const progress = byId('quiz-progress');
  const out = byId('quiz-result');

  const answers = (): Map<StarId, number> => {
    const m = new Map<StarId, number>();
    for (const s of STARS) {
      const v = form.querySelector<HTMLInputElement>(`input[name="q-${s.id}"]:checked`)?.value;
      if (v !== undefined) m.set(s.id, Number(v));
    }
    return m;
  };

  const update = (): void => {
    const n = answers().size;
    progress.textContent = `${n} / ${STARS.length}`;
    go.disabled = n < STARS.length;
  };
  form.addEventListener('change', update);
  form.addEventListener('reset', () => {
    window.setTimeout(update, 0);
    out.hidden = true;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const a = answers();
    if (a.size < STARS.length) return;
    // 同点は生まれ月順で先の星座
    const ranked = STARS.map((s, order) => ({ s, score: a.get(s.id) ?? 0, order }))
      .sort((x, y) => y.score - x.score || x.order - y.order);
    const top = ranked[0];
    if (!top || top.score === 0) {
      out.innerHTML = `<h3>今夜は、大きく揺れている星座はなさそうです</h3>` +
        `<p class="muted">それも大切な状態です。気になる星座があれば、<a href="#pillar">12の星座</a>から読んでみてください。</p>`;
    } else {
      const second = ranked[1] && ranked[1].score > 0 ? ranked[1].s : undefined;
      out.innerHTML = resultHtml(top.s, second);
    }
    out.hidden = false;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/* ---------- 2. 思考のクセ ---------- */

function habitsHtml(): string {
  return `<div class="habit-grid">${STARS.map((s) =>
    `<a class="habit" href="#pillar/${s.id}">${starIcon(s.id)}<span><b>${esc(s.name)}の星座</b><span class="muted">${esc(s.view)}</span></span>` +
    `<span class="habit-text">${esc(s.habit)}</span></a>`).join('')}</div>`;
}

/* ---------- 3. 星図 ---------- */

function starMapHtml(): string {
  const seeds = loadSeeds();
  if (seeds.length === 0) {
    return `<div class="map-empty"><p>まだ種がありません。<a href="#site">吐き出しノート</a>で書くと、どの観点で悩みやすいかがここに表れます。</p></div>`;
  }
  const counts = new Map<StarId, number>();
  seeds.forEach((s) => counts.set(s.star, (counts.get(s.star) ?? 0) + 1));
  const max = Math.max(...counts.values());
  const tops = STARS.filter((s) => counts.get(s.id) === max);
  return `<p class="map-lead">これまでに <b>${seeds.length}</b> 個の種を残しています。いちばん多いのは ` +
    tops.map((s) => `<a href="#pillar/${s.id}">${esc(s.name)}の星座（${esc(s.view)}）</a>`).join('、') +
    ` です。悩みが多いのは、それだけ大切にしている観点だということです。</p>` +
    `<div class="map-bars">${STARS.map((s) => {
      const n = counts.get(s.id) ?? 0;
      return `<div class="map-bar${n === 0 ? ' zero' : ''}">${starIcon(s.id)}<span class="mb-name">${esc(s.name)}</span>` +
        `<span class="mb-track"><i style="width:${max ? (n / max) * 100 : 0}%"></i></span><b>${n}</b></div>`;
    }).join('')}</div>` +
    `<p><a href="#seeds">種の一覧を見る</a></p>`;
}

/* ---------- 入口 ---------- */

export function initSelfPage(): void {
  byId('self-quiz').innerHTML = quizHtml();
  byId('self-habits').innerHTML = habitsHtml();
  const arts = articlesByKind('self');
  byId('self-articles').innerHTML = arts.length ? articleList(arts, null) : '<p class="muted">準備中です。</p>';
  initQuiz();
}

/** 表示のたびに星図だけ更新（診断の回答は消さない） */
export function renderSelfPage(): void {
  byId('self-map').innerHTML = starMapHtml();
}

export function topSeedStar(): StarId | undefined {
  const counts = new Map<StarId, number>();
  loadSeeds().forEach((s) => counts.set(s.star, (counts.get(s.star) ?? 0) + 1));
  let best: StarId | undefined;
  let max = 0;
  counts.forEach((n, id) => {
    if (n > max) { max = n; best = id; }
  });
  return best;
}
