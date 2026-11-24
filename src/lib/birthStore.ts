import type { Month } from '../types';
import { isMonth } from '../data/stars';

/**
 * 選んだ生まれ月の保存先。localStorage のみで、外部には送らない。
 * 「変わる」の1週間の実験を生まれ星座に合わせるために使う。
 */
const KEY = 'fortunelab.birthMonth.v1';

export function loadBirthMonth(): Month | null {
  try {
    const n = Number(localStorage.getItem(KEY));
    return isMonth(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveBirthMonth(m: Month | null): void {
  try {
    if (m === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(m));
  } catch {
    /* 保存できない環境でも画面は壊さない */
  }
}
