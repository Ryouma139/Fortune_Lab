/** FORTUNE LAB 独自の12星座 ID（= src/stars/ 直下のフォルダ名） */
export type StarId =
  | 'hoshi' | 'ne' | 'kaze' | 'hana' | 'mori' | 'ame'
  | 'umi' | 'taiyo' | 'tsuki' | 'mi' | 'yama' | 'kawa';

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/* =====================================================================
 * 星座の基本データ：src/stars/<id>/star.ts
 * ===================================================================== */

export interface Star {
  id: StarId;
  /** 星座名（「〇の星座」の〇） */
  name: string;
  /** 生まれ月 */
  month: Month;
  /** 観点 */
  view: string;
  /** モチーフの意味 */
  origin: string;
  keywords: readonly [string, string, string];
  /** あって当然の悩み（「／」区切り） */
  worry: string;
  /** 星座の声（占い） */
  fortune: string;
  /** 思考のクセ（自己分析） */
  habit: string;
  /** 今日の実験（自己啓発） */
  experiment: string;
  /** 吐き出しの文章と照合する語（部分一致） */
  matchWords: readonly string[];
  /** 今夜の星座診断（12問）でこの星座が担当する質問 */
  question: string;
  /** 1週間の実験（月曜始まり7日分。どれも5分以内）。曜日は自動で付く */
  week: WeekPlan;
}

/** 月曜始まり7日分の実験 */
export type WeekPlan = readonly [string, string, string, string, string, string, string];

/** 吐き出しノートのジャンル */
export interface VentCategory {
  label: string;
  star: StarId;
}

/* =====================================================================
 * 星座ページ（詳細版）：src/stars/<id>/pillar.ts（任意）
 * 無い星座は star.ts から組み立てるテンプレ版で表示する。
 * ===================================================================== */

export interface PillarWorry {
  title: string;
  fortune: string;
  habit: string;
  experiment: string;
  /** 詳しく読む記事（同じ星座フォルダの articles/<slug>.ts）。未作成なら省略 */
  article?: string;
}

/** 自己分析ワークのパーツ */
export type WorkBlock =
  | {
      kind: 'scale';
      heading: string;
      prompt: string;
      levels: readonly { label: string; desc: string; dots: number }[];
      defaultIndex: number;
      /** 選んだ段階の説明の後ろに続ける一文 */
      outro: string;
    }
  | {
      kind: 'checklist';
      heading: string;
      items: readonly string[];
      /** 0件のときの文 */
      zero: string;
      /** 1件以上のときの文。{n} が件数に置き換わる */
      some: string;
    }
  | { kind: 'cards'; heading: string; items: readonly string[] };

export interface PillarDetail {
  /** h1 の【〇の星座】に続く部分。改行位置は \n */
  headline: string;
  sub: string;
  /** 冒頭の文。最後の一文 emphasis は太字で続く */
  intro: string;
  emphasis: string;
  ventPrompt: string;
  ventPlaceholder?: string;
  /** プロフィール欄の「今日の実験」（短く） */
  experimentShort: string;
  /** 「なぜ〇なのか」。figure は viewBox 0 0 120 70 の SVG 中身（省略時はアイコン） */
  why: { text: string; figure?: string };
  strengths: readonly string[];
  stumbles: readonly string[];
  flipNote: string;
  worries: readonly PillarWorry[];
  /** 自己分析ワーク。toc は目次に出す短い名前 */
  work?: { title: string; toc?: string; blocks: readonly WorkBlock[] };
  cta: { heading: string; points: readonly string[] };
  related: readonly { star: StarId; why: string }[];
  faq: readonly { q: string; a: string }[];
}

/* =====================================================================
 * 記事：src/stars/<star>/articles/<slug>.ts（1ファイル1記事）
 * 星座とIDはフォルダ名・ファイル名から決まる。
 * ===================================================================== */

/** A記事テンプレートの本文。設計書「06 A記事テンプレート」の順に表示される */
export interface ArticleBody {
  /** リード：悩みの場面 →「あって当然」の一文 → 吐き出しへ誘う */
  lead: string;
  /** STEP 1 吐き出し欄の問いかけ */
  ventPrompt: string;
  ventPlaceholder?: string;
  /** STEP 2 みんなの「わかる」（Phase 2 から。省略可） */
  voices?: readonly { text: string; count: number }[];
  /** STEP 3 星座の声・思考のクセ（省略時は星座データを使う） */
  reading?: { fortune?: string; habit?: string };
  /** STEP 4 今日の実験 */
  experiment: { action: string; detail: string };
  /** CTA① 話して整理（省略時は既定の文言） */
  cta?: { heading: string; points: readonly string[] };
  /** STEP 5 次に読む星座 */
  next?: readonly StarId[];
  /** FAQ（独自星座の説明 Q&A は自動で先頭に入る） */
  faq?: readonly { q: string; a: string }[];
}

/**
 * 記事の種別。どのメニューに載るかが決まる（星座ページには種別に関係なく載る）。
 * 判定は「読み終えたときに何が残るか」（設計書 05 記事タイプ）。
 *
 * - worry  悩み×星座：「悩んでいいんだ」と受け止められる。KW：〇〇 疲れた／つらい
 * - self   知る：「だから私はこうなるのか」と自分の傾向に気づく。
 *          本文の中心は思考のクセ・強み・価値観（手順ではない）。クセは表裏で書き、
 *          セルフチェック等のワークを1つ入れる。KW：〇〇 性格／なぜ〇〇してしまう
 * - growth 変わる：「これをやってみよう」と明日の行動が決まる。
 *          本文の中心が具体的な行動と手順。KW：〇〇 方法／やり方／コツ
 *
 * 注意：全記事の最後に「今日の実験」があるので、実験があるだけでは growth にしない。
 */
export type ArticleKind = 'worry' | 'self' | 'growth';

/** 記事ファイルに書く内容。body が無いものは「準備中」 */
export interface ArticleInput {
  /** 省略時は 'worry' */
  kind?: ArticleKind;
  /** LAB NOTE の通し番号（サイト全体で一意） */
  no: number;
  /** 【〇の星座】は自動で付くので書かない */
  title: string;
  /** 表示用のチップ（星座名は自動で付く） */
  tags: readonly string[];
  /** 吐き出しとの照合に使う語（部分一致） */
  keywords: readonly string[];
  /** 狙う検索キーワード（設計メモに表示） */
  targetKeywords?: readonly string[];
  /** YYYY-MM-DD */
  updated?: string;
  body?: ArticleBody;
}

/** 読み込み後の記事（フォルダ・ファイル名から star / slug / id を付与） */
export interface Article extends ArticleInput {
  kind: ArticleKind;
  star: StarId;
  slug: string;
  /** `${star}/${slug}`。URL は #article/<id> */
  id: string;
}

/* =====================================================================
 * 吐き出しの記録＝「種」。文章は持たない。端末内（localStorage）にだけ保存。
 * ===================================================================== */

export interface Seed {
  id: string;
  /** ISO 8601 */
  at: string;
  /** 今夜の星座（推定結果） */
  star: StarId;
  /** ユーザーが選んだキーワード */
  tags: string[];
  /** 文章から見つかった辞書の語（本文そのものではない） */
  matched: string[];
  /** そのとき表示した記事 ID */
  shown: string[];
  /** 開いた記事 ID */
  read: string[];
  /** 今日の実験をやってみたか */
  experimentDone: boolean;
}

/* =====================================================================
 * 運営・ポリシー系ページ：src/pages/<id>.ts（1ファイル1ページ）
 * URL は #<id>。フッターからのみリンクし、トップには中身を出さない。
 * ===================================================================== */

export interface InfoContact {
  name: string;
  /** 電話番号など（公式サイトで確認したものを載せる） */
  number?: string;
  url?: string;
  note: string;
}

export interface InfoSection {
  heading: string;
  paragraphs?: readonly string[];
  list?: readonly string[];
  /** 項目名と内容の表 */
  table?: readonly (readonly [string, string])[];
  contacts?: readonly InfoContact[];
  /** 表や一覧の後ろに置く文 */
  after?: readonly string[];
  links?: readonly { label: string; href: string }[];
}

export interface InfoPage {
  /** URL の #<id>。ファイル名と揃える */
  id: string;
  title: string;
  /** 英字の小見出し */
  eyebrow: string;
  lead: string;
  /** YYYY-MM-DD */
  updated: string;
  /** 例文であることの注意書き（公開前に外す） */
  draftNote?: string;
  sections: readonly InfoSection[];
}

/* ===================================================================== */

/** 上部の表示切替タブ */
export type TabKey = 'site' | 'pillar' | 'self' | 'growth' | 'article' | 'blueprint';

/** URL ハッシュから決まる表示 */
export type Route =
  | { view: 'site' | 'self' | 'growth' | 'seeds' | 'blueprint' | 'pillar-index' }
  | { view: 'star'; star: StarId }
  | { view: 'article'; id?: string }
  | { view: 'info'; id: string };

export type Season = '春' | '夏' | '秋' | '冬';
