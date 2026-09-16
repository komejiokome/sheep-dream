import {
  UPGRADES,
  LAWS,
  MAX_SLEEP_DEPTH,
  createInitialState,
  normalizeState,
  applyOfflineProgress,
  manualCount,
  tick,
  clickValue,
  autoRate,
  upgradeCost,
  canBuyUpgrade,
  buyUpgrade,
  prestigeTarget,
  prestigeCarry,
  canDeepenSleep,
  deepenSleep,
  canBuyLaw,
  buyLaw,
  canWake,
  wake,
  depthProfile,
  debugBoost,
} from './game.js';

const STORAGE_KEY = 'sheep-dream-save-v1';
const nf = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 2 });
const RENDER_INTERVAL_MS = 100;

function formatNumber(value) {
  if (!Number.isFinite(value)) return '∞';
  const abs = Math.abs(value);
  if (abs < 10_000) return nf.format(Math.floor(value * 10) / 10);
  if (abs < 1e15) return compact.format(value);
  return value.toExponential(2);
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return createInitialState();
    return applyOfflineProgress(normalizeState(JSON.parse(saved)));
  } catch {
    return createInitialState();
  }
}

let state = loadState();
let lastFrame = performance.now();
let lastRender = 0;
let lastAmbient = 0;
let lastLogKey = '';
let endingRendered = false;
const activePointers = new Set();

const $ = (selector) => document.querySelector(selector);
const refs = {
  story: $('#story'),
  sheep: $('#sheep-count'),
  click: $('#click-value'),
  auto: $('#auto-rate'),
  depth: $('#sleep-depth'),
  shards: $('#dream-shards'),
  phaseIndex: $('#phase-index'),
  phaseName: $('#phase-name'),
  progress: $('#sleep-progress'),
  target: $('#sleep-target'),
  deepen: $('#deepen-button'),
  count: $('#count-button'),
  pasture: $('#pasture'),
  upgrades: $('#upgrades'),
  laws: $('#laws'),
  log: $('#event-log'),
  tabs: $('.tabs'),
  panels: [...document.querySelectorAll('.tab-panel')],
  wakeCard: $('#wake-card'),
  wake: $('#wake-button'),
  transition: $('#depth-transition'),
  transitionName: $('#transition-name'),
  ending: $('#ending'),
  endingSummary: $('#ending-summary'),
  debug: $('#debug-panel'),
};

function setText(element, value) {
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

function storyFor(s) {
  if (s.ended) return '朝です。';
  if (s.laws.notSheep) return '月も雲も、もう羊として数えていい。';
  if (s.sleepDepth >= 4) return '朝の気配が、夢の輪郭をほどいていく。';
  if (s.laws.countCounters) return '数えられた羊まで、こちらを数え返している。';
  if (s.sleepDepth >= 2) return '星のあいだを、羊の群れが巡っている。';
  if (s.sleepDepth >= 1) return '雲の寝床から、羊が次々に降りてくる。';
  if (autoRate(s) > 0) return '少し眠い。羊がひとりでに柵を越え始めた。';
  if (s.sheep >= 18) return '手を止めても続く方法を探してみよう。';
  return '羊を一匹ずつ数えてください。';
}

function buildStaticLists() {
  refs.upgrades.innerHTML = UPGRADES.map((upgrade) => `
    <article class="shop-row" data-row-upgrade="${upgrade.id}">
      <div class="shop-copy"><strong title="${upgrade.name}">${upgrade.name}</strong><p>${upgrade.description}</p></div>
      <button type="button" data-upgrade="${upgrade.id}" aria-label="${upgrade.name}を購入"></button>
    </article>`).join('');
  refs.laws.innerHTML = LAWS.map((law) => `
    <article class="shop-row law-row" data-row-law="${law.id}">
      <div class="shop-copy"><strong title="${law.name}">${law.name}</strong><p>${law.description}</p></div>
      <button type="button" data-law="${law.id}" aria-label="${law.name}を取得"></button>
    </article>`).join('');
}

function renderLists() {
  for (const upgrade of UPGRADES) {
    const row = refs.upgrades.querySelector(`[data-row-upgrade="${upgrade.id}"]`);
    const button = row.querySelector('button');
    const level = state.runUpgrades[upgrade.id] || 0;
    const bought = !upgrade.repeatable && level > 0;
    const locked = state.sleepDepth < upgrade.unlockDepth;
    const cost = upgradeCost(state, upgrade.id);
    button.disabled = bought || locked || !canBuyUpgrade(state, upgrade.id);
    setText(button, bought
      ? '取得済み'
      : locked
        ? `深度 ${upgrade.unlockDepth} で解禁`
        : `${formatNumber(cost)}匹${upgrade.repeatable && level ? ` · Lv.${level}` : ''}`);
    row.classList.toggle('purchased', bought);
    row.classList.toggle('locked', locked);
  }

  for (const law of LAWS) {
    const row = refs.laws.querySelector(`[data-row-law="${law.id}"]`);
    const button = row.querySelector('button');
    const bought = Boolean(state.laws[law.id]);
    const locked = state.sleepDepth < law.depth;
    button.disabled = bought || locked || !canBuyLaw(state, law.id);
    setText(button, bought ? '書き換え済み' : locked ? `深度 ${law.depth} で解禁` : `かけら ${law.cost}`);
    row.classList.toggle('purchased', bought);
    row.classList.toggle('locked', locked);
  }
}

function renderLog() {
  const key = (state.eventLog || []).map((event) => `${event.at}:${event.text}`).join('|');
  if (key === lastLogKey) return;
  lastLogKey = key;
  refs.log.replaceChildren(...(state.eventLog || []).map((event) => {
    const item = document.createElement('div');
    item.textContent = event.text;
    return item;
  }));
}

function renderEnding() {
  if (!state.ended || !state.wakeSummary || endingRendered) return;
  endingRendered = true;
  const summary = state.wakeSummary;
  const minutes = Math.floor(summary.elapsedSeconds / 60);
  const seconds = Math.floor(summary.elapsedSeconds % 60);
  refs.endingSummary.replaceChildren();
  const duration = document.createElement('p');
  duration.innerHTML = `<strong>${minutes}分 ${seconds}秒</strong> 眠りました。`;
  const counts = document.createElement('p');
  counts.textContent = `${formatNumber(summary.lifetimeSheep)}匹の羊を数え、手で押したのは${formatNumber(summary.manualClicks)}回でした。`;
  const close = document.createElement('p');
  close.className = 'muted';
  close.textContent = 'おやすみなさい。また今度。';
  refs.endingSummary.append(duration, counts, close);
}

function render() {
  const phase = depthProfile(state.sleepDepth);
  setText(refs.story, storyFor(state));
  setText(refs.sheep, formatNumber(state.sheep));
  setText(refs.click, formatNumber(clickValue(state)));
  setText(refs.auto, formatNumber(autoRate(state)));
  setText(refs.depth, state.sleepDepth);
  setText(refs.shards, formatNumber(state.dreamShards));
  setText(refs.phaseIndex, `深度 ${state.sleepDepth}`);
  setText(refs.phaseName, phase.name);

  const target = prestigeTarget(state.sleepDepth);
  const atDeepestSleep = state.sleepDepth >= MAX_SLEEP_DEPTH;
  const pct = atDeepestSleep ? 100 : Math.min(100, (state.sheep / target) * 100);
  refs.progress.style.width = `${pct}%`;
  refs.progress.parentElement.setAttribute('aria-valuenow', String(Math.round(pct)));
  setText(refs.target, atDeepestSleep
    ? '夢のいちばん深い場所。最後の法則を書き換えよう。'
    : canDeepenSleep(state)
      ? `深く眠れます · 余りから ${formatNumber(prestigeCarry(state))}匹を次へ`
      : `次の眠りまで ${formatNumber(Math.max(0, target - state.sheep))}匹`);
  refs.deepen.disabled = !canDeepenSleep(state);
  refs.count.disabled = state.ended;

  renderLists();
  renderLog();
  refs.wakeCard.classList.toggle('hidden', !canWake(state));
  refs.ending.classList.toggle('hidden', !state.ended);
  document.body.dataset.depth = String(state.sleepDepth);
  renderEnding();
}

function spawnSheep(manual = false) {
  if (refs.pasture.querySelectorAll('.runner').length >= 14) return;
  const element = document.createElement('span');
  element.className = manual ? 'runner manual' : 'runner';
  const dreamThings = ['☁️', '🌙', '⭐'];
  element.textContent = state.laws.notSheep && Math.random() < 0.28
    ? dreamThings[Math.floor(Math.random() * dreamThings.length)]
    : '🐑';
  element.style.setProperty('--lane', `${22 + Math.random() * 42}px`);
  element.style.setProperty('--duration', `${1.6 + Math.random() * 1.15}s`);
  refs.pasture.appendChild(element);
  element.addEventListener('animationend', () => element.remove(), { once: true });
}

function save() {
  try {
    state = { ...state, lastSavedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing and full storage should not stop the game loop.
  }
}

function performCount() {
  if (state.ended) return;
  state = manualCount(state);
  spawnSheep(true);
  render();
}

function selectTab(name) {
  for (const tab of refs.tabs.querySelectorAll('[role="tab"]')) {
    const selected = tab.dataset.tab === name;
    tab.classList.toggle('active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }
  for (const panel of refs.panels) panel.classList.toggle('hidden', panel.id !== `panel-${name}`);
}

function playDepthTransition() {
  setText(refs.transitionName, depthProfile(state.sleepDepth).name);
  refs.transition.classList.remove('playing');
  void refs.transition.offsetWidth;
  refs.transition.classList.add('playing');
}

refs.count.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  event.preventDefault();
  activePointers.add(event.pointerId);
  refs.count.classList.add('pressed');
  performCount();
});

const releasePointer = (event) => {
  activePointers.delete(event.pointerId);
  if (activePointers.size === 0) refs.count.classList.remove('pressed');
};
refs.count.addEventListener('pointerup', releasePointer);
refs.count.addEventListener('pointercancel', releasePointer);
refs.count.addEventListener('lostpointercapture', releasePointer);
refs.count.addEventListener('gesturestart', (event) => event.preventDefault());
refs.count.addEventListener('click', (event) => {
  if (event.detail === 0) performCount();
});

refs.deepen.addEventListener('click', () => {
  const previousDepth = state.sleepDepth;
  state = deepenSleep(state);
  if (state.sleepDepth === previousDepth) return;
  playDepthTransition();
  selectTab('laws');
  for (let index = 0; index < 7; index += 1) setTimeout(() => spawnSheep(false), index * 70);
  save();
  render();
});

refs.upgrades.addEventListener('click', (event) => {
  const button = event.target.closest('[data-upgrade]');
  if (!button) return;
  state = buyUpgrade(state, button.dataset.upgrade);
  render();
});

refs.laws.addEventListener('click', (event) => {
  const button = event.target.closest('[data-law]');
  if (!button) return;
  const before = state;
  state = buyLaw(state, button.dataset.law);
  if (state === before) return;
  for (let index = 0; index < 4; index += 1) setTimeout(() => spawnSheep(false), index * 85);
  save();
  render();
});

refs.tabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-tab]');
  if (tab) selectTab(tab.dataset.tab);
});

refs.tabs.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const tabs = [...refs.tabs.querySelectorAll('[role="tab"]')];
  const current = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  const next = tabs[(current + direction + tabs.length) % tabs.length];
  event.preventDefault();
  selectTab(next.dataset.tab);
  next.focus();
});

refs.wake.addEventListener('click', () => {
  state = wake(state);
  save();
  render();
});

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.repeat || state.ended) return;
  if (event.target.closest?.('button, input, textarea, select')) return;
  event.preventDefault();
  performCount();
});

function frame(now) {
  const dt = Math.min(1, (now - lastFrame) / 1000);
  lastFrame = now;
  state = tick(state, dt);
  if (autoRate(state) > 0 && now - lastAmbient > Math.max(500, 1900 - Math.log10(autoRate(state) + 1) * 190)) {
    lastAmbient = now;
    spawnSheep(false);
  }
  if (now - lastRender >= RENDER_INTERVAL_MS) {
    lastRender = now;
    render();
  }
  requestAnimationFrame(frame);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    save();
    return;
  }
  state = applyOfflineProgress(state);
  lastFrame = performance.now();
  render();
});

if (new URLSearchParams(location.search).has('debug')) {
  refs.debug.classList.remove('hidden');
  refs.debug.addEventListener('click', (event) => {
    const action = event.target.dataset.debug;
    if (action === 'boost') state = debugBoost(state, 10_000_000, 10);
    if (action === 'prestige') state = { ...state, sheep: prestigeTarget(state.sleepDepth) };
    if (action === 'reset') {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
      return;
    }
    render();
  });
}

buildStaticLists();
selectTab('upgrades');
render();
setInterval(save, 2000);
window.addEventListener('beforeunload', save);
requestAnimationFrame(frame);
