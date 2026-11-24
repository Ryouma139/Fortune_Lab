/** id で要素を取得し、無ければ例外（HTML とコードのずれを早期に検出する） */
export function byId<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} が見つかりません`);
  return el as T;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** innerHTML に差し込む文字列のエスケープ */
export function esc(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ESC[c] ?? c);
}

/** 偏りのないシャッフル（Fisher–Yates） */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** 固定ヘッダーぶんずらしてスクロール */
export function scrollToSection(id: string, offset = 60): void {
  const t = document.getElementById(id);
  if (!t) return;
  window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
}

/** `[data-attr]` リンクをページ内ジャンプにする */
export function bindJumpLinks(attr: string): void {
  document.querySelectorAll<HTMLAnchorElement>(`[data-${attr}]`).forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = a.getAttribute(`data-${attr}`);
      if (target) scrollToSection(target);
    });
  });
}

/** チェックボックスで `.show-notes` を切り替える */
export function bindNotesToggle(checkboxId: string, targetId: string): void {
  const cb = byId<HTMLInputElement>(checkboxId);
  const target = byId(targetId);
  const sync = (): void => { target.classList.toggle('show-notes', cb.checked); };
  cb.addEventListener('change', sync);
  sync();
}
