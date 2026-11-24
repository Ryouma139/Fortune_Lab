import type { PillarDetail, StarId } from '../types';
import { isStarId } from './icons';

/**
 * 詳細版の星座ページ。src/stars/<id>/pillar.ts があれば読み込む。
 * 無い星座はテンプレ版（star.ts から自動生成）で表示する。
 */
const modules = import.meta.glob<{ default: PillarDetail }>('../stars/*/pillar.ts', { eager: true });

const PILLARS = new Map<StarId, PillarDetail>();
for (const [path, mod] of Object.entries(modules)) {
  const folder = path.split('/').at(-2);
  if (isStarId(folder)) PILLARS.set(folder, mod.default);
  else console.error(`[pillars] 星座フォルダが不正です: ${path}`);
}

export function getPillar(id: StarId): PillarDetail | undefined {
  return PILLARS.get(id);
}

export function hasDetailedPillar(id: StarId): boolean {
  return PILLARS.has(id);
}
