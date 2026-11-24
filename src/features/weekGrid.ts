import type { Star } from '../types';
import { esc } from '../lib/dom';

const DAYS = ['月', '火', '水', '木', '金', '土', '日'] as const;

/** 星座の1週間の実験（月曜始まり7日分）。今日の曜日を強調する */
export function weekGrid(s: Star): string {
  const today = (new Date().getDay() + 6) % 7; // 月曜=0
  return `<div class="week">${s.week.map((text, i) =>
    `<div class="day${i === today ? ' today' : ''}"><b>${DAYS[i]}</b>${esc(text)}</div>`).join('')}</div>`;
}
