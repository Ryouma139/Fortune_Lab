import type { Article, ArticleInput, ArticleKind, StarId } from '../types';
import { isStarId } from './icons';

/**
 * 記事レジストリ。src/stars/<star>/articles/<slug>.ts を自動で読み込む。
 * 星座はフォルダ名、slug はファイル名から決まる。
 * 記事を増やすときは、その星座の articles/ にファイルを1つ足すだけでよい
 * （記事一覧・星座ページ・吐き出しの関連記事・トップの新着に自動で載る）。
 */
const modules = import.meta.glob<{ default: ArticleInput }>('../stars/*/articles/*.ts', { eager: true });

function collect(): Article[] {
  const list: Article[] = [];
  const nos = new Map<number, string>();
  for (const [path, mod] of Object.entries(modules)) {
    const parts = path.split('/');
    const star = parts.at(-3);
    const slug = parts.at(-1)?.replace(/\.ts$/, '');
    if (!isStarId(star) || !slug) {
      console.error(`[articles] 星座フォルダが不正です: ${path}`);
      continue;
    }
    const id = `${star}/${slug}`;
    const dup = nos.get(mod.default.no);
    if (dup) console.error(`[articles] 通し番号 No.${mod.default.no} が重複しています: ${dup} と ${id}`);
    nos.set(mod.default.no, id);
    list.push({ ...mod.default, kind: mod.default.kind ?? 'worry', star, slug, id });
  }
  return list.sort((x, y) => y.no - x.no);
}

/** 新しい順 */
export const ARTICLES: readonly Article[] = collect();

const BY_ID = new Map(ARTICLES.map((a) => [a.id, a]));

export function getArticle(id: string): Article | undefined {
  return BY_ID.get(id);
}

export function getArticleIn(star: StarId, slug: string): Article | undefined {
  return BY_ID.get(`${star}/${slug}`);
}

export function articleHref(a: Article): string {
  return `#article/${a.id}`;
}

export function isPublished(a: Article): boolean {
  return a.body !== undefined;
}

export function articleNo(a: Article): string {
  return `No.${String(a.no).padStart(3, '0')}`;
}

/** 公開済みを先に、それぞれ新しい順 */
export function articlesOf(star: StarId): Article[] {
  return ARTICLES.filter((a) => a.star === star)
    .sort((x, y) => Number(isPublished(y)) - Number(isPublished(x)) || y.no - x.no);
}

/** 種別ごと。公開済みを先に、それぞれ新しい順 */
export function articlesByKind(kind: ArticleKind): Article[] {
  return ARTICLES.filter((a) => a.kind === kind)
    .sort((x, y) => Number(isPublished(y)) - Number(isPublished(x)) || y.no - x.no);
}

export const KIND_LABEL: Record<ArticleKind, string> = { worry: '悩み×星座', self: '知る', growth: '変わる' };
