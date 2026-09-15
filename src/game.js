export const SAVE_VERSION = 1;
export const MAX_SLEEP_DEPTH = 4;

export const UPGRADES = [
  { id: 'pillow', name: 'やわらかい枕', description: '手で数える羊が2倍になる。', baseCost: 12, scale: 2.2, repeatable: true },
  { id: 'jumper', name: '勝手に跳ぶ羊', description: '毎秒0.5匹ぶん、羊が勝手に柵を跳ぶ。', baseCost: 30, scale: 2, repeatable: true },
  { id: 'flock', name: '眠そうな群れ', description: '毎秒2匹ぶん、群れが流れてくる。', baseCost: 160, scale: 2.45, repeatable: true },
  { id: 'recursive', name: '羊が羊を数える', description: '自動で数える速度が4倍になる。', baseCost: 750, scale: 1, repeatable: false },
  { id: 'drowse', name: '夢うつつ', description: 'すべての羊カウントが3倍になる。', baseCost: 3200, scale: 1, repeatable: false },
];

export const LAWS = [
  { id: 'skipFence', depth: 1, cost: 1, name: '柵を飛ばなくても数えてよい', description: 'すべてのカウントが2倍。' },
  { id: 'doubleCount', depth: 2, cost: 2, name: '一度に二匹数えてよい', description: 'すべてのカウントがさらに3倍。' },
  { id: 'countCounters', depth: 3, cost: 3, name: '数えられた羊も羊を数えてよい', description: '自動カウントがさらに5倍。' },
  { id: 'notSheep', depth: 4, cost: 4, name: '羊ではないものも羊として数えてよい', description: 'すべてのカウントがさらに10倍。月も雲も、たぶん羊。' },
];
function blankRunUpgrades() {
  return { pillow: 0, jumper: 0, flock: 0, recursive: 0, drowse: 0 };
}

export function createInitialState(now = Date.now()) {
  return {
    version: SAVE_VERSION,
    sheep: 0,
    lifetimeSheep: 0,
    manualClicks: 0,
    sleepDepth: 0,
    dreamShards: 0,
    runUpgrades: blankRunUpgrades(),
    laws: {},
    startedAt: now,
    lastSavedAt: now,
    elapsedSeconds: 0,
    ended: false,
    wakeSummary: null,
    eventLog: [{ at: 0, text: '羊を一匹ずつ数えてください。' }],
  };
}

export function prestigeTarget(depth) {
  return Math.floor(2400 * (35 ** depth));
}

function addEvent(state, text) {
  const next = [{ at: state.elapsedSeconds, text }, ...(state.eventLog || [])].slice(0, 12);
  return { ...state, eventLog: next };
}
export function upgradeCost(state, upgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade) throw new Error(`Unknown upgrade: ${upgradeId}`);
  const level = state.runUpgrades[upgradeId] || 0;
  return Math.ceil(upgrade.baseCost * (upgrade.scale ** level));
}

export function getModifiers(state) {
  const depth = 14 ** state.sleepDepth;
  const skipFence = state.laws.skipFence ? 2 : 1;
  const doubleCount = state.laws.doubleCount ? 3 : 1;
  const countCounters = state.laws.countCounters ? 5 : 1;
  const notSheep = state.laws.notSheep ? 10 : 1;
  const drowse = state.runUpgrades.drowse ? 3 : 1;
  const global = depth * skipFence * doubleCount * notSheep * drowse;
  return { global, autoExtra: countCounters };
}

export function clickValue(state) {
  const { global } = getModifiers(state);
  return (2 ** state.runUpgrades.pillow) * global;
}

export function autoRate(state) {
  const { global, autoExtra } = getModifiers(state);
  const base = (state.runUpgrades.jumper * 0.5) + (state.runUpgrades.flock * 2);
  const recursive = state.runUpgrades.recursive ? 4 : 1;
  return base * recursive * autoExtra * global;
}

function gainSheep(state, amount) {
  if (amount <= 0 || state.ended) return state;
  return { ...state, sheep: state.sheep + amount, lifetimeSheep: state.lifetimeSheep + amount };
}
export function manualCount(state) {
  if (state.ended) return state;
  let next = gainSheep(state, clickValue(state));
  next = { ...next, manualClicks: next.manualClicks + 1 };
  return next;
}

export function tick(state, deltaSeconds) {
  if (state.ended || deltaSeconds <= 0) return state;
  const dt = Math.min(deltaSeconds, 60 * 60 * 4);
  const amount = autoRate(state) * dt;
  const next = gainSheep(state, amount);
  return { ...next, elapsedSeconds: next.elapsedSeconds + dt };
}

export function canBuyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade || state.ended) return false;
  const level = state.runUpgrades[upgradeId] || 0;
  if (!upgrade.repeatable && level > 0) return false;
  return state.sheep >= upgradeCost(state, upgradeId);
}

export function buyUpgrade(state, upgradeId) {
  if (!canBuyUpgrade(state, upgradeId)) return state;
  const cost = upgradeCost(state, upgradeId);
  const next = {
    ...state,
    sheep: state.sheep - cost,
    runUpgrades: { ...state.runUpgrades, [upgradeId]: (state.runUpgrades[upgradeId] || 0) + 1 },
  };
  const name = UPGRADES.find((item) => item.id === upgradeId).name;
  return addEvent(next, `${name}を手に入れた。`);
}
export function canDeepenSleep(state) {
  return !state.ended
    && state.sleepDepth < MAX_SLEEP_DEPTH
    && state.sheep >= prestigeTarget(state.sleepDepth);
}

export function deepenSleep(state) {
  if (!canDeepenSleep(state)) return state;
  const award = state.sleepDepth + 1;
  const nextDepth = state.sleepDepth + 1;
  let next = {
    ...state,
    sheep: 0,
    sleepDepth: nextDepth,
    dreamShards: state.dreamShards + award,
    runUpgrades: blankRunUpgrades(),
  };
  next = addEvent(next, `眠りが一段深くなった。夢のかけら +${award}。`);
  if (nextDepth === 1) next = addEvent(next, '夢の中では、前より時間が速く流れる。');
  if (nextDepth === 3) next = addEvent(next, '羊たちは、こちらを見て数を数え始めた。');
  return next;
}

export function canBuyLaw(state, lawId) {
  const law = LAWS.find((item) => item.id === lawId);
  if (!law || state.ended || state.laws[lawId]) return false;
  return state.sleepDepth >= law.depth && state.dreamShards >= law.cost;
}

export function buyLaw(state, lawId) {
  if (!canBuyLaw(state, lawId)) return state;
  const law = LAWS.find((item) => item.id === lawId);
  let next = {
    ...state,
    dreamShards: state.dreamShards - law.cost,
    laws: { ...state.laws, [lawId]: true },
  };
  return addEvent(next, `夢の法則を書き換えた：「${law.name}」`);
}
export function canWake(state) {
  return !state.ended && state.sleepDepth >= 4 && Boolean(state.laws.notSheep);
}

export function wake(state, now = Date.now()) {
  if (!canWake(state)) return state;
  const summary = {
    elapsedSeconds: state.elapsedSeconds,
    lifetimeSheep: state.lifetimeSheep,
    manualClicks: state.manualClicks,
    sleepDepth: state.sleepDepth,
    endedAt: now,
  };
  return addEvent({ ...state, ended: true, wakeSummary: summary }, '目が覚めた。');
}

export function normalizeState(raw, now = Date.now()) {
  if (!raw || raw.version !== SAVE_VERSION) return createInitialState(now);
  const base = createInitialState(raw.startedAt || now);
  const next = {
    ...base,
    ...raw,
    runUpgrades: { ...base.runUpgrades, ...(raw.runUpgrades || {}) },
    laws: { ...(raw.laws || {}) },
    eventLog: Array.isArray(raw.eventLog) ? raw.eventLog.slice(0, 12) : base.eventLog,
    lastSavedAt: raw.lastSavedAt || now,
  };
  const finiteNonNegative = (value, fallback = 0) => (
    Number.isFinite(value) && value >= 0 ? value : fallback
  );
  next.sheep = finiteNonNegative(next.sheep);
  next.lifetimeSheep = Math.max(next.sheep, finiteNonNegative(next.lifetimeSheep));
  next.manualClicks = Math.floor(finiteNonNegative(next.manualClicks));
  next.sleepDepth = Math.min(MAX_SLEEP_DEPTH, Math.floor(finiteNonNegative(next.sleepDepth)));
  next.dreamShards = Math.floor(finiteNonNegative(next.dreamShards));
  next.elapsedSeconds = finiteNonNegative(next.elapsedSeconds);
  next.startedAt = finiteNonNegative(next.startedAt, now);
  next.lastSavedAt = finiteNonNegative(next.lastSavedAt, now);
  for (const upgrade of UPGRADES) {
    const level = Math.floor(finiteNonNegative(next.runUpgrades[upgrade.id]));
    next.runUpgrades[upgrade.id] = upgrade.repeatable ? level : Math.min(1, level);
  }
  next.ended = Boolean(next.ended);
  next.wakeSummary = next.ended && next.wakeSummary ? next.wakeSummary : null;
  return next;
}

export function applyOfflineProgress(state, now = Date.now()) {
  const elapsed = Math.max(0, Math.min((now - state.lastSavedAt) / 1000, 60 * 60 * 4));
  const next = tick(state, elapsed);
  return { ...next, lastSavedAt: now };
}

export function debugBoost(state, sheep = 1000000, shards = 10) {
  return { ...state, sheep: state.sheep + sheep, dreamShards: state.dreamShards + shards };
}
