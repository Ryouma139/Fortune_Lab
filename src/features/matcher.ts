import type { Article, StarId } from '../types';
// 照合語は各星座の src/stars/<id>/star.ts（matchWords）と記事ファイル（keywords）にある
import { ARTICLES } from '../data/articles';
import { STARS } from '../data/stars';

/**
 * 吐き出しの文章と選んだキーワードから、今夜の星座と関連記事を推定する。
 * すべてブラウザ内で行い、文章はどこにも送らない・残さない。
 */

/** 強いつらさのサイン。見つかったら相談窓口を最優先で表示する */
const CRISIS_WORDS = ['死にたい', '消えたい', '自殺', '生きていたくない', 'いなくなりたい', '終わりにしたい'];

const FALLBACK_STAR: StarId = 'tsuki';
const MAX_ARTICLES = 3;

export interface MatchResult {
  star: StarId;
  second?: StarId;
  /** 文章から見つかった照合語（辞書の語のみ） */
  matched: string[];
  articles: Article[];
  crisis: boolean;
}

const hits = (text: string, words: readonly string[]): string[] => words.filter((w) => text.includes(w.toLowerCase()));

export function matchVent(rawText: string, selected: readonly StarId[]): MatchResult {
  const text = rawText.toLowerCase();
  const matched = new Set<string>();

  // 星座スコア：選んだキーワード +3、照合語1つにつき +1
  const scored = STARS.map((s, order) => {
    const h = hits(text, s.matchWords);
    h.forEach((w) => matched.add(w));
    const score = (selected.includes(s.id) ? 3 : 0) + h.length;
    return { id: s.id, score, order };
  }).sort((a, b) => b.score - a.score || a.order - b.order);

  const top = scored[0];
  const star: StarId = top && top.score > 0 ? top.id : FALLBACK_STAR;
  const runner = scored[1];
  const second = runner && runner.score > 0 && runner.id !== star ? runner.id : undefined;

  // 記事スコア：星座一致 +3（副は +1）、記事の照合語1つにつき +2
  const articles = ARTICLES.map((a) => {
    const h = hits(text, a.keywords);
    h.forEach((w) => matched.add(w));
    const score = (a.star === star ? 3 : a.star === second ? 1 : 0) + h.length * 2;
    return { a, score };
  })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, MAX_ARTICLES)
    .map((x) => x.a);

  return {
    star,
    second,
    matched: [...matched].slice(0, 8),
    articles,
    crisis: CRISIS_WORDS.some((w) => text.includes(w)),
  };
}
