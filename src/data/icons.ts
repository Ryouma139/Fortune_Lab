import type { StarId } from '../types';

/** 星座アイコン（viewBox 0 0 40 40 の SVG 中身） */
export const ICONS: Record<StarId, string> = {
  hoshi: '<path class="fill" d="M20 5l4.4 9.6 10.4 1.1-7.8 7 2.2 10.3L20 27.8l-9.2 5.2 2.2-10.3-7.8-7 10.4-1.1z"/>',
  ne: '<path d="M20 5v14M20 19c-6 3-10 8-12 15M20 19c6 3 10 8 12 15M20 19v15M14 25c-2 1-4 3-5 5M26 25c2 1 4 3 5 5"/>',
  kaze: '<path d="M5 15h19a5 5 0 1 0-5-5M5 22h25a4 4 0 1 1-4 4M5 29h12"/>',
  hana: '<circle class="fill" cx="20" cy="20" r="3.5"/><circle cx="20" cy="11" r="5"/><circle cx="28.5" cy="17" r="5"/><circle cx="25.5" cy="27" r="5"/><circle cx="14.5" cy="27" r="5"/><circle cx="11.5" cy="17" r="5"/>',
  mori: '<path d="M13 7l-8 14h16zM28 10l-7 13h14zM13 21v12M28 23v10M5 33h30"/>',
  ame: '<path d="M12 7c-3 5-4 8 0 8s3-3 0-8zM27 11c-3 5-4 8 0 8s3-3 0-8zM18 21c-3 5-4 8 0 8s3-3 0-8z"/>',
  umi: '<path d="M4 16q4-4 8 0t8 0 8 0 8 0M4 23q4-4 8 0t8 0 8 0 8 0M4 30q4-4 8 0t8 0 8 0 8 0"/>',
  taiyo: '<circle class="fill" cx="20" cy="20" r="7"/><path d="M20 4v5M20 31v5M4 20h5M31 20h5M8.7 8.7l3.5 3.5M27.8 27.8l3.5 3.5M8.7 31.3l3.5-3.5M27.8 12.2l3.5-3.5"/>',
  // 三日月：外側は中心(20,20)半径14の大弧、内側は同じ半径の弧で欠けを作る（線画で他の星座と統一）
  tsuki: '<path d="M24 6.6A14 14 0 1 0 24 33.4 14 14 0 0 1 24 6.6z"/>',
  mi: '<circle cx="20" cy="23" r="11"/><path d="M20 12c0-4 2-7 6-7M20 12c-3-3-7-3-9-1 3 2 6 2 9 1"/>',
  yama: '<path d="M3 33L15 12l6 9 4-6 12 18z"/><path d="M12 17l3 3 3-3"/>',
  kawa: '<path d="M10 4c9 7-6 13 3 20s-3 9 2 12M22 4c9 7-6 13 3 20s-3 9 2 12"/>',
};

/** カード裏面の紋章 */
export const CARD_BACK_ICON =
  '<circle cx="20" cy="20" r="14"/><path d="M20 6v28M6 20h28"/><circle class="fill" cx="20" cy="20" r="4"/>';

export function isStarId(v: string | null | undefined): v is StarId {
  return v != null && Object.prototype.hasOwnProperty.call(ICONS, v);
}

/** 星座アイコンの SVG 文字列 */
export function iconSvg(inner: string, cls = ''): string {
  return `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 40 40" aria-hidden="true">${inner}</svg>`;
}

export function starIcon(id: StarId, cls = ''): string {
  return iconSvg(ICONS[id], cls);
}

/** HTML 内の `data-ico="mori"` を持つ SVG にアイコンを流し込む */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<SVGElement>('[data-ico]').forEach((el) => {
    const id = el.dataset.ico;
    if (isStarId(id)) el.innerHTML = ICONS[id];
  });
}
