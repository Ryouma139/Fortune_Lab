import type { Article, ArticleBody, Star, StarId } from '../types';
import { ARTICLES, articleHref, articleNo, articlesOf, getArticle, isPublished } from '../data/articles';
import { STARS, getStar } from '../data/stars';
import { isStarId, starIcon } from '../data/icons';
import { byId, esc } from '../lib/dom';

/** 設計メモ（A記事テンプレート共通） */
const NOTES = {
  title: '【独自星座名】＋悩みの場面＋得られること。星座名は指名検索とシリーズ認知のために必ず入れる（自動で付与）。',
  lead: '①悩みの場面を具体的に描く ②悩みを肯定する一文（ブランドの約束）③吐き出しへ誘う。解決策や広告はまだ出さない。',
  vent: '全記事の冒頭に、その星座に合わせた問いかけ付きの吐き出し欄。読む前に書くことで「自分ごと」になり、読了率が上がる。',
  voices: 'Phase 2で匿名投稿を公開。反応は「わかる」だけにしてコメント欄は置かない。数値は表示例。',
  reading: '「星座の声（占い）→ 思考のクセ（自己分析）→ 今日の実験（自己啓発）」の3段は全記事共通。省略時は星座データを使う。',
  cta: '「一人では整理しきれない」と感じた読者への選択肢として提示。売り込みではなく案内の温度感に。ASP直リンクは比較記事のみ。',
} as const;

const DEFAULT_CTA = {
  heading: '書いても整理しきれないときは、話して整理する方法も',
  points: ['匿名・自宅から相談できる', '初回は特典つきで試しやすい'],
};

let notesOn = true;
let listFilter: StarId | null = null;

const note = (key: keyof typeof NOTES, extra = ''): string =>
  `<div class="note"><b>${key.toUpperCase()}</b>${esc(NOTES[key])}${extra}</div>`;

const fullTitle = (a: Article): string => `【${getStar(a.star).name}の星座】${a.title}`;

const formatDate = (d: string): string => d.replace(/-/g, '.');

function sideBox(a: Article): string {
  const s = getStar(a.star);
  const others = articlesOf(a.star).filter((x) => x.id !== a.id).slice(0, 5);
  const list = others.length
    ? `<ul class="side-list">${others.map((x) => `<li><a href="${articleHref(x)}">${esc(x.title)}</a>${isPublished(x) ? '' : ' <span class="chip">準備中</span>'}</li>`).join('')}</ul>`
    : '<p>ほかの記事は準備中です。</p>';
  return `<aside class="side"><div class="sticky side">` +
    `<div class="box"><p class="mono eyebrow">FREE</p><h3>今夜の星座診断</h3><p>12問・約2分</p><a class="btn" href="#self">診断する</a></div>` +
    `<div class="box"><p class="mono eyebrow">PR</p><h3>電話占いの選び方</h3><p>料金・特典・相談ジャンルで比較</p><a class="btn brass" href="${articleHref(a)}">比較を見る</a></div>` +
    `<div class="box"><h3>${esc(s.name)}の星座の記事</h3>${list}<p><a href="#pillar/${s.id}">${esc(s.name)}の星座ページへ</a></p></div>` +
    `</div></aside>`;
}

function crumb(s: Star): string {
  return `<p class="crumb"><a href="#site">ホーム</a> ＞ <a href="#article">記事</a> ＞ <a href="#pillar/${s.id}">${esc(s.name)}の星座（${esc(s.view)}）</a></p>`;
}

function chips(a: Article, s: Star): string {
  return `<span class="chip">${esc(s.name)}の星座</span>` +
    a.tags.map((t) => `<span class="chip${t === 'PR' ? ' warn' : t.includes('実験') ? ' brass' : ''}">${esc(t)}</span>`).join('');
}

/* ---------- 公開記事 ---------- */

function renderBody(a: Article, body: ArticleBody): string {
  const s = getStar(a.star);
  const fortune = body.reading?.fortune ?? s.fortune;
  const habit = body.reading?.habit ?? s.habit;
  const cta = body.cta ?? DEFAULT_CTA;
  const next = (body.next ?? []).filter((id) => id !== a.star).map(getStar);
  const faq = [
    { q: '12の星座は、普通の星座占いと違うの？', a: 'はい。FORTUNE LABが「人が生きるうえで大切な12の観点」から作った独自の星座です。生まれ月で決まる生まれ星座と、悩みに合わせて選ぶ今夜の星座があります。' },
    ...(body.faq ?? []),
  ];
  const kw = a.targetKeywords?.length ? ` 狙いKW：${a.targetKeywords.map((k) => `「${esc(k)}」`).join('')}` : '';

  const sections: string[] = ['まず吐き出す'];
  if (body.voices?.length) sections.push('みんなの「わかる」');
  sections.push(`${s.name}の星座からのメッセージ`, '今日の実験', '次に読む', 'よくある質問');
  let n = 0;
  const h2 = (t: string): string => `<h2>${++n}. ${esc(t)}</h2>`;

  return `<article class="art" id="art">` +
    `<div class="art-top">${crumb(s)}<label class="toggle-notes"><input type="checkbox" id="anotes"${notesOn ? ' checked' : ''}> 設計メモを表示</label></div>` +
    `<h1>${esc(fullTitle(a))}</h1>` +
    `<div class="byline">${chips(a, s)}<span class="chip brass">吐き出し欄つき</span><span>LAB NOTE ${articleNo(a)}</span>${a.updated ? `<span>${formatDate(a.updated)} 更新</span>` : ''}</div>` +
    note('title', kw) +
    `<p>${esc(body.lead)}</p>` + note('lead') +
    `<nav class="toc" aria-label="目次"><b>目次</b><ol>${sections.map((t) => `<li>${esc(t)}</li>`).join('')}</ol></nav>` +

    h2('まず吐き出す') +
    `<div class="mini-pad"><p class="mono">吐き出しノート｜${esc(s.name)}の星座</p>` +
    `<label for="avent">${esc(body.ventPrompt)}</label>` +
    `<textarea id="avent" placeholder="${esc(body.ventPlaceholder ?? '')}"></textarea><p class="fine">送信も保存もされません。</p></div>` +
    note('vent') +

    (body.voices?.length
      ? h2('みんなの「わかる」') +
        `<p>同じ${esc(s.name)}の星座の悩みを、読者の声から紹介します（編集部で要約しています）。</p>` +
        `<div class="voices">${body.voices.map((v) => `<div class="voice">${esc(v.text)}<span>わかる ${v.count}</span></div>`).join('')}</div>` +
        note('voices')
      : '') +

    h2(`${s.name}の星座からのメッセージ`) +
    `<div class="reading"><h3>${starIcon(s.id)}${esc(s.name)}の星座｜${esc(s.view)}</h3>` +
    `<div class="row"><span class="mono">星座の声</span><div>${esc(fortune)}</div></div>` +
    `<div class="row"><span class="mono">思考のクセ</span><div>${esc(habit)}</div></div>` +
    `<div class="row"><span class="mono">キーワード</span><div>${esc(s.keywords.join('・'))}</div></div></div>` +
    note('reading') +

    h2('今日の実験') +
    `<p><b>${esc(body.experiment.action)}</b>${esc(body.experiment.detail)}</p>` +
    `<div class="cta-box"><span class="mono">PR｜話して整理したい夜に</span><h4>${esc(cta.heading)}</h4>` +
    `<ul>${cta.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` +
    `<a class="btn brass" href="${articleHref(a)}">電話占いの選び方を見る</a><small>料金・特典は各公式サイトで最新情報をご確認ください。</small></div>` +
    note('cta') +

    h2('次に読む') +
    `<p>${next.length
      ? `同じ悩みをもつ人には、${next.map((x) => `<a href="#pillar/${x.id}">${esc(x.name)}の星座（${esc(x.view)}）</a>`).join('と')}もおすすめです。`
      : ''}あなたの今夜の星座を確かめたい人は<a href="#self">無料診断</a>へ。</p>` +

    h2('よくある質問') +
    `<dl class="faq">${faq.map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`).join('')}</dl>` +

    `<div class="author"><div class="avatar">LAB</div><div><b>FORTUNE LAB 編集部</b><br><span class="muted">占いの執筆者と、キャリアコンサルタント資格をもつ編集者が担当。悩みを否定しないことを編集方針にしています。</span></div></div>` +
    `</article>`;
}

/* ---------- 準備中 ---------- */

function renderDraft(a: Article): string {
  const s = getStar(a.star);
  return `<article class="art">` +
    `<div class="art-top">${crumb(s)}</div>` +
    `<h1>${esc(fullTitle(a))}</h1>` +
    `<div class="byline">${chips(a, s)}<span class="chip warn">準備中</span><span>LAB NOTE ${articleNo(a)}</span></div>` +
    `<p>この記事は準備中です。公開まで、${esc(s.name)}の星座からのメッセージを置いておきます。</p>` +
    `<div class="reading"><h3>${starIcon(s.id)}${esc(s.name)}の星座｜${esc(s.view)}</h3>` +
    `<div class="row"><span class="mono">星座の声</span><div>${esc(s.fortune)}</div></div>` +
    `<div class="row"><span class="mono">思考のクセ</span><div>${esc(s.habit)}</div></div>` +
    `<div class="row"><span class="mono">今日の実験</span><div class="exp">${esc(s.experiment)}</div></div></div>` +
    `<p><a class="btn ghost" href="#pillar/${s.id}">${esc(s.name)}の星座ページを読む</a></p>` +
    `</article>`;
}

/* ---------- 一覧 ---------- */

function renderList(): string {
  const counts = new Map<StarId, number>();
  ARTICLES.forEach((a) => counts.set(a.star, (counts.get(a.star) ?? 0) + 1));
  const published = ARTICLES.filter(isPublished).length;

  const filters = `<div class="al-filter" role="group" aria-label="星座で絞り込む">` +
    `<button type="button" data-afilter="" aria-pressed="${listFilter === null}">すべて <b>${ARTICLES.length}</b></button>` +
    STARS.map((s) => {
      const c = counts.get(s.id) ?? 0;
      return `<button type="button" data-afilter="${s.id}" aria-pressed="${listFilter === s.id}"${c ? '' : ' disabled'}>${starIcon(s.id)}${esc(s.name)} <b>${c}</b></button>`;
    }).join('') + `</div>`;

  const groups = STARS.filter((s) => (listFilter ? s.id === listFilter : (counts.get(s.id) ?? 0) > 0)).map((s) => {
    const rows = articlesOf(s.id).map((a) =>
      `<li><a href="${articleHref(a)}"><span class="mono">${articleNo(a)}</span><span class="al-title">${esc(a.title)}</span>` +
      `<span class="chip${isPublished(a) ? ' brass' : ''}">${isPublished(a) ? '公開' : '準備中'}</span></a></li>`).join('');
    return `<section class="al-group"><h2>${starIcon(s.id)}${esc(s.name)}の星座<span>${esc(s.view)}</span><a href="#pillar/${s.id}">星座ページ</a></h2><ul class="al-list">${rows}</ul></section>`;
  }).join('');

  return `<div class="al-head"><p class="mono eyebrow">LAB NOTE</p><h1>記事一覧</h1>` +
    `<p class="muted">12の星座ごとに記事をまとめています。公開 ${published} 本 ／ 準備中 ${ARTICLES.length - published} 本</p>` +
    `<label class="toggle-notes"><input type="checkbox" id="anotes"${notesOn ? ' checked' : ''}> 設計メモを表示</label></div>` +
    `<div class="note"><b>HOW TO ADD</b>記事は src/stars/&lt;星座&gt;/articles/&lt;slug&gt;.ts に1ファイル1記事で追加する。置いたフォルダの星座に自動で紐づき、この一覧・星座ページ・吐き出しの関連記事・トップの新着に載る。URL は #article/&lt;星座&gt;/&lt;slug&gt;。body を書くまでは「準備中」。</div>` +
    filters + groups;
}

/* ---------- 入口 ---------- */

export function renderArticleView(id?: string): void {
  const root = byId('article-root');
  const a = id ? getArticle(id) : undefined;
  if (id && !a) {
    root.innerHTML = `<div class="al-head"><h1>記事が見つかりません</h1><p class="muted">URLが変わったか、削除された可能性があります。</p><p><a class="btn" href="#article">記事一覧へ</a></p></div>`;
  } else if (!a) {
    root.innerHTML = renderList();
  } else {
    root.innerHTML = `<div class="art-grid">${a.body ? renderBody(a, a.body) : renderDraft(a)}${sideBox(a)}</div>`;
  }
  root.classList.toggle('show-notes', notesOn);
  document.title = a ? `${fullTitle(a)}｜FORTUNE LAB` : 'FORTUNE LAB サイト設計';
}

export function initArticleView(): void {
  const root = byId('article-root');
  root.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.id !== 'anotes') return;
    notesOn = t.checked;
    root.classList.toggle('show-notes', notesOn);
  });
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-afilter]');
    if (!b) return;
    const id = b.dataset.afilter;
    listFilter = isStarId(id) ? id : null;
    root.innerHTML = renderList();
  });
}
