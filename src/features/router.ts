import type { Route, StarId, TabKey } from '../types';
import { isStarId } from '../data/icons';
import { getInfoPage } from '../data/pages';
import { byId } from '../lib/dom';

const SECTIONS: Record<Route['view'], string> = {
  site: 'v-site',
  self: 'v-self',
  growth: 'v-growth',
  seeds: 'v-seeds',
  article: 'v-article',
  blueprint: 'v-blueprint',
  'pillar-index': 'v-pillar',
  star: 'v-star',
  info: 'v-info',
};

/**
 * `#pillar` → 星座一覧、`#pillar/<id>` → 星座ページ
 * `#article` → 記事一覧、`#article/<star>/<slug>` → 記事
 */
export function parseHash(hash: string): Route {
  const [head = '', sub, slug] = hash.replace(/^#/, '').split('/').map(decodeURIComponent);
  switch (head) {
    case 'self':
    case 'growth':
    case 'seeds':
    case 'blueprint':
      return { view: head };
    case 'article':
      return sub ? { view: 'article', id: slug ? `${sub}/${slug}` : sub } : { view: 'article' };
    case 'pillar':
      if (isStarId(sub)) return { view: 'star', star: sub };
      return { view: 'pillar-index' };
    default:
      // #about などの運営・ポリシー系ページ（src/pages/<id>.ts）
      return getInfoPage(head) ? { view: 'info', id: head } : { view: 'site' };
  }
}

/** 対応する上部タブ。運営・ポリシー系ページはどのタブにも属さない */
function tabOf(route: Route): TabKey | null {
  switch (route.view) {
    case 'site':
    case 'self':
    case 'growth':
    case 'article':
    case 'blueprint':
      return route.view;
    case 'seeds':
      return 'self';
    case 'info':
      return null;
    default:
      return 'pillar';
  }
}

export interface RouteHandlers {
  onStar: (id: StarId) => void;
  onSeeds: () => void;
  onArticle: (id?: string) => void;
  onSelf: () => void;
  onGrowth: () => void;
  onInfo: (id: string) => void;
}

const DEFAULT_TITLE = document.title;

export function initRouter({ onStar, onSeeds, onArticle, onSelf, onGrowth, onInfo }: RouteHandlers): void {
  const render = (): void => {
    const route = parseHash(location.hash);
    document.title = DEFAULT_TITLE;
    if (route.view === 'star') onStar(route.star);
    if (route.view === 'seeds') onSeeds();
    if (route.view === 'article') onArticle(route.id);
    if (route.view === 'self') onSelf();
    if (route.view === 'growth') onGrowth();
    if (route.view === 'info') onInfo(route.id);
    (Object.keys(SECTIONS) as Route['view'][]).forEach((k) => {
      byId(SECTIONS[k]).hidden = k !== route.view;
    });
    const tab = tabOf(route);
    document.querySelectorAll<HTMLAnchorElement>('.switch a').forEach((a) => {
      if (tab && a.getAttribute('href') === `#${tab}`) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
  };
  window.addEventListener('hashchange', render);
  render();
}
