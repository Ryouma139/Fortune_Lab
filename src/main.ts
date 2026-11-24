import './style.css';
import { hydrateIcons } from './data/icons';
import { bindJumpLinks, bindNotesToggle } from './lib/dom';
import { initRouter } from './features/router';
import { initVentNote } from './features/ventNote';
import { initTonightCards } from './features/tonightCards';
import { initStarGrid } from './features/starGrid';
import { renderBlueprintTable, renderPosts } from './features/listings';
import { initStarPages, renderStarPage } from './features/starPages';
import { initSeeds, renderSeeds } from './features/seeds';
import { initArticleView, renderArticleView } from './features/articlePage';
import { initSelfPage, renderSelfPage } from './features/selfPage';
import { initGrowthPage, renderGrowthPage } from './features/growthPage';
import { renderFooterLinks, renderInfoPage } from './features/infoPage';

hydrateIcons();
renderFooterLinks();

// トップ
initVentNote();
initTonightCards();
initStarGrid();
renderPosts();

// 星座ページ（#pillar 一覧、#pillar/<id> 各星座。中身は src/stars/<id>/）
initStarPages();
bindNotesToggle('inotes', 'v-pillar');

// 記事（#article 一覧、#article/<id> 各記事）
initArticleView();

// 設計書
renderBlueprintTable();
bindJumpLinks('jump');

// 知る（#self）・変わる（#growth）
initSelfPage();
initGrowthPage();

// 種の記録（#seeds）
initSeeds();

initRouter({
  onStar: renderStarPage,
  onSeeds: renderSeeds,
  onArticle: renderArticleView,
  onSelf: renderSelfPage,
  onGrowth: renderGrowthPage,
  onInfo: renderInfoPage,
});
