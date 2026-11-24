import type { InfoPage } from '../types';

/**
 * 運営・ポリシー系ページのレジストリ。src/pages/<id>.ts を自動で読み込む。
 * フッターのリンクは FOOTER_ORDER の順に並ぶ。
 */
const modules = import.meta.glob<{ default: InfoPage }>('../pages/*.ts', { eager: true });

const PAGES = new Map<string, InfoPage>();
for (const [path, mod] of Object.entries(modules)) {
  const file = path.split('/').at(-1)?.replace(/\.ts$/, '');
  if (file !== mod.default.id) console.error(`[pages] ファイル名と id が違います: ${path} (id: ${mod.default.id})`);
  PAGES.set(mod.default.id, mod.default);
}

export const FOOTER_ORDER = ['about', 'ad-policy', 'guide', 'soudan', 'privacy'] as const;

export function getInfoPage(id: string): InfoPage | undefined {
  return PAGES.get(id);
}

export function footerPages(): InfoPage[] {
  const ordered = FOOTER_ORDER.map((id) => PAGES.get(id)).filter((p): p is InfoPage => p !== undefined);
  const rest = [...PAGES.values()].filter((p) => !ordered.includes(p));
  return [...ordered, ...rest];
}
