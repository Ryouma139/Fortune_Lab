import type { ArticleInput, InfoPage, PillarDetail, Star } from '../types';

/*
 * src/stars/<id>/ に置くファイル用のヘルパー。
 * 型チェックを効かせるだけで、値はそのまま返す。
 */

/** src/stars/<id>/star.ts */
export function defineStar(star: Star): Star {
  return star;
}

/** src/stars/<id>/pillar.ts（任意。詳細版の星座ページ） */
export function definePillar(pillar: PillarDetail): PillarDetail {
  return pillar;
}

/** src/stars/<id>/articles/<slug>.ts */
export function defineArticle(article: ArticleInput): ArticleInput {
  return article;
}

/** src/pages/<id>.ts（運営者情報・ポリシーなど） */
export function definePage(page: InfoPage): InfoPage {
  return page;
}
