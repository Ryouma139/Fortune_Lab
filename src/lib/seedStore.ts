import type { Seed } from '../types';
import { isStarId } from '../data/icons';

/**
 * 種（吐き出しの記録）の保存先。localStorage のみで、外部には送らない。
 * プライベートウィンドウ等で使えない場合も画面が壊れないよう、すべて try/catch で包む。
 */
const KEY = 'fortunelab.seeds.v1';
const MAX_SEEDS = 300;

const isStrArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

function isSeed(v: unknown): v is Seed {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.at === 'string' && typeof o.star === 'string' && isStarId(o.star) &&
    isStrArray(o.tags) && isStrArray(o.matched) && isStrArray(o.shown) && isStrArray(o.read) &&
    typeof o.experimentDone === 'boolean';
}

/** 新しい順 */
export function loadSeeds(): Seed[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSeed) : [];
  } catch {
    return [];
  }
}

function saveSeeds(seeds: Seed[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(seeds.slice(0, MAX_SEEDS)));
    return true;
  } catch {
    return false;
  }
}

export function newSeedId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function addSeed(seed: Seed): boolean {
  return saveSeeds([seed, ...loadSeeds()]);
}

export function updateSeed(id: string, fn: (s: Seed) => Seed): boolean {
  return saveSeeds(loadSeeds().map((s) => (s.id === id ? fn(s) : s)));
}

export function markRead(seedId: string, articleId: string): void {
  updateSeed(seedId, (s) => (s.read.includes(articleId) ? s : { ...s, read: [...s.read, articleId] }));
}

export function removeSeed(id: string): boolean {
  return saveSeeds(loadSeeds().filter((s) => s.id !== id));
}

export function clearSeeds(): boolean {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
