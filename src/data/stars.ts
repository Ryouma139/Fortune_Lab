import type { Month, Star, StarId, VentCategory } from '../types';

/**
 * 星座レジストリ。src/stars/<id>/star.ts を自動で読み込む。
 */
const modules = import.meta.glob<{ default: Star }>('../stars/*/star.ts', { eager: true });

function collect(): Star[] {
  const list = Object.entries(modules).map(([path, mod]) => {
    const folder = path.split('/').at(-2);
    if (folder !== mod.default.id) console.error(`[stars] フォルダ名と id が違います: ${path} (id: ${mod.default.id})`);
    return mod.default;
  });
  const months = new Set(list.map((s) => s.month));
  if (list.length !== 12 || months.size !== 12) console.error('[stars] 12星座・12か月がそろっていません');
  return list.sort((a, b) => a.month - b.month);
}

/** 生まれ月順 */
export const STARS: readonly Star[] = collect();

const BY_ID = new Map<StarId, Star>(STARS.map((s) => [s.id, s]));
const BY_MONTH = new Map<Month, Star>(STARS.map((s) => [s.month, s]));

export function getStar(id: StarId): Star {
  const s = BY_ID.get(id);
  if (!s) throw new Error(`Unknown star: ${id}`);
  return s;
}

export function getBirthStar(month: Month): Star {
  const s = BY_MONTH.get(month);
  if (!s) throw new Error(`No star for month: ${month}`);
  return s;
}

export function isMonth(n: number): n is Month {
  return Number.isInteger(n) && n >= 1 && n <= 12;
}

export const VENT_CATEGORIES: readonly VentCategory[] = [
  { label: '人間関係', star: 'mori' },
  { label: '仕事', star: 'taiyo' },
  { label: '恋愛', star: 'hana' },
  { label: '家族', star: 'ne' },
  { label: '疲れ', star: 'ame' },
  { label: '自分のこと', star: 'tsuki' },
  { label: 'お金', star: 'mi' },
  { label: '将来', star: 'hoshi' },
];
