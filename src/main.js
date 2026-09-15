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
  canDeepenSleep,
  deepenSleep,
  canBuyLaw,
  buyLaw,
  canWake,
  wake,
  debugBoost,
} from './game.js';

const STORAGE_KEY = 'sheep-dream-save-v1';
const nf = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 2 });

function formatNumber(value) {
  if (!Number.isFinite(value)) return '∞';
  const abs = Math.abs(value);
  if (abs < 10000) return nf.format(Math.floor(value * 10) / 10);
  if (abs < 1e15) return compact.format(value);
  return value.toExponential(2);
}

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return applyOfflineProgress(normalizeState(raw));
  } catch {
    return createInitialState();
  }
}

let state = loadState();
let lastFrame = performance.now();
let lastAmbient = 0;

const $ = (selector) => document.querySelector(selector);
const refs = {
  story: $('#story'),
  sheep: $('#sheep-count'),
  click: $('#click-value'),
  auto: $('#auto-rate'),
  depth: $('#sleep-depth'),
  shards: $('#dream-shards'),
  progress: $('#sleep-progress'),
  target: $('#sleep-target'),
  deepen: $('#deepen-button'),
  count: $('#count-button'),
  pasture: $('#pasture'),
  upgrades: $('#upgrades'),
  laws: $('#laws'),
  log: $('#event-log'),
  wakeCard: $('#wake-card'),
  wake: $('#wake-button'),
  ending: $('#ending'),
  endingSummary: $('#ending-summary'),
  debug: $('#debug-panel'),
};

function storyFor(s) {
  if (s.ended) return '朝です。';
  if (s.laws.notSheep) return '月も雲も、もう羊として数えていい。';
  if (s.laws.countCounters) return '数えられた羊まで、こちらを数え返している。';
  if (s.sleepDepth >= 2) return '夢の中では、数えるという行為そのものが曖昧になってきた。';
  if (s.runUpgrades.recursive) return '羊が羊を数えている。たぶん大丈夫。';
  if (autoRate(s) > 0) return '少し眠い。羊が勝手に柵を越え始めた。';
  if (s.sheep >= 12) return 'まだ眠くはない。もう少し数えよう。';
  return '羊を一匹ずつ数えてください。';
}

function buildStaticLists() {
  refs.upgrades.innerHTML = UPGRADES.map((u) => `
    <div class="shop-row" data-row-upgrade="${u.id}">
      <div><strong>${u.name}</strong><p>${u.description}</p></div>
      <button type="button" data-upgrade="${u.id}"></button>
    </div>`).join('');
  refs.laws.innerHTML = LAWS.map((law) => `
    <div class="shop-row law-row" data-row-law="${law.id}">
      <div><strong>${law.name}</strong><p>${law.description}</p></div>
      <button type="button" data-law="${law.id}"></button>
    </div>`).join('');
}

function renderLists() {
  for (const u of UPGRADES) {
    const row = refs.upgrades.querySelector(`[data-row-upgrade="${u.id}"]`);
    const button = row.querySelector('button');
    const level = state.runUpgrades[u.id] || 0;
    const bought = !u.repeatable && level > 0;
    const cost = upgradeCost(state, u.id);
    button.disabled = bought || !canBuyUpgrade(state, u.id);
    button.textContent = bought ? '取得済み' : `${formatNumber(cost)}匹${u.repeatable && level ? ` · Lv.${level}` : ''}`;
    row.classList.toggle('purchased', bought);
  }

  for (const law of LAWS) {
    const row = refs.laws.querySelector(`[data-row-law="${law.id}"]`);
    const button = row.querySelector('button');
    const bought = Boolean(state.laws[law.id]);
    const locked = state.sleepDepth < law.depth;
    button.disabled = bought || locked || !canBuyLaw(state, law.id);
    button.textContent = bought ? '夢の法則' : locked ? `深度 ${law.depth} で解禁` : `かけら ${law.cost}`;
    row.classList.toggle('purchased', bought);
    row.classList.toggle('locked', locked);
  }
}

function render() {
  refs.story.textContent = storyFor(state);
  refs.sheep.textContent = formatNumber(state.sheep);
  refs.click.textContent = `${formatNumber(clickValue(state))} / クリック`;
  refs.auto.textContent = `${formatNumber(autoRate(state))} / 秒`;
  refs.depth.textContent = state.sleepDepth;
  refs.shards.textContent = `夢のかけら ${formatNumber(state.dreamShards)}`;

  const target = prestigeTarget(state.sleepDepth);
  const atDeepestSleep = state.sleepDepth >= MAX_SLEEP_DEPTH;
  const pct = atDeepestSleep ? 100 : Math.min(100, (state.sheep / target) * 100);
  refs.progress.style.width = `${pct}%`;
  refs.progress.parentElement.setAttribute('aria-valuenow', String(Math.round(pct)));
  refs.target.textContent = atDeepestSleep
    ? '夢のいちばん深い場所にいる。'
    : canDeepenSleep(state)
    ? 'もう少し深く眠れそうだ。'
    : `次の眠りまで ${formatNumber(Math.max(0, target - state.sheep))}匹`;
  refs.deepen.disabled = !canDeepenSleep(state);
  refs.count.disabled = state.ended;

  renderLists();
  refs.log.replaceChildren(...(state.eventLog || []).map((event) => {
    const item = document.createElement('div');
    item.textContent = event.text;
    return item;
  }));
  refs.wakeCard.classList.toggle('hidden', !canWake(state));
  refs.ending.classList.toggle('hidden', !state.ended);
  document.body.dataset.depth = String(state.sleepDepth);

  if (state.ended && state.wakeSummary) {
    const s = state.wakeSummary;
    const minutes = Math.floor(s.elapsedSeconds / 60);
    const seconds = Math.floor(s.elapsedSeconds % 60);
    refs.endingSummary.innerHTML = `
      <p><strong>${minutes}分 ${seconds}秒</strong> 眠りました。</p>
      <p>${formatNumber(s.lifetimeSheep)}匹の羊を数え、手で押したのは${formatNumber(s.manualClicks)}回でした。</p>
      <p class="muted">おやすみなさい。また今度。</p>`;
  }
}

function spawnSheep(manual = false) {
  if (refs.pasture.children.length > 18) return;
  const el = document.createElement('span');
  el.className = manual ? 'runner manual' : 'runner';
  const others = ['☁️', '🌙', '⭐'];
  el.textContent = state.laws.notSheep && Math.random() < 0.28
    ? others[Math.floor(Math.random() * others.length)]
    : '🐑';
  el.style.setProperty('--lane', `${15 + Math.random() * 45}px`);
  el.style.setProperty('--duration', `${1.6 + Math.random() * 1.2}s`);
  refs.pasture.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}

function save() {
  state = { ...state, lastSavedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

refs.count.addEventListener('click', () => {
  state = manualCount(state);
  spawnSheep(true);
  render();
});

refs.deepen.addEventListener('click', () => {
  state = deepenSleep(state);
  for (let i = 0; i < 7; i += 1) setTimeout(() => spawnSheep(false), i * 80);
  save();
  render();
});

refs.upgrades.addEventListener('click', (event) => {
  const id = event.target.dataset.upgrade;
  if (!id) return;
  state = buyUpgrade(state, id);
  render();
});

refs.laws.addEventListener('click', (event) => {
  const id = event.target.dataset.law;
  if (!id) return;
  state = buyLaw(state, id);
  for (let i = 0; i < 4; i += 1) setTimeout(() => spawnSheep(false), i * 90);
  save();
  render();
});

refs.wake.addEventListener('click', () => {
  state = wake(state);
  save();
  render();
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && !event.repeat && !state.ended) {
    event.preventDefault();
    refs.count.click();
  }
});

function frame(now) {
  const dt = Math.min(1, (now - lastFrame) / 1000);
  lastFrame = now;
  state = tick(state, dt);
  if (autoRate(state) > 0 && now - lastAmbient > Math.max(450, 1800 - Math.log10(autoRate(state) + 1) * 180)) {
    lastAmbient = now;
    spawnSheep(false);
  }
  render();
  requestAnimationFrame(frame);
}

if (new URLSearchParams(location.search).has('debug')) {
  refs.debug.classList.remove('hidden');
  refs.debug.addEventListener('click', (event) => {
    const action = event.target.dataset.debug;
    if (action === 'boost') state = debugBoost(state, 1_000_000_000, 10);
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
render();
setInterval(save, 2000);
window.addEventListener('beforeunload', save);
requestAnimationFrame(frame);
