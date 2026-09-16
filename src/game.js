export const SAVE_VERSION = 2;
export const MAX_SLEEP_DEPTH = 4;

export const DEPTH_PROFILES = [
  { name: 'まどろみ', global: 1, manual: 1, auto: 1 },
  { name: '雲の寝床', global: 1.8, manual: 1.2, auto: 1.15 },
  { name: '星の牧草地', global: 3.2, manual: 1.35, auto: 1.55 },
  { name: '数える深海', global: 5, manual: 1.5, auto: 2.2 },
  { name: '朝のふち', global: 7, manual: 1.75, auto: 3 },
];

const PRESTIGE_TARGETS = [900, 16_000, 220_000, 2_200_000];
const OVERFLOW_EFFICIENCY = 0.35;
const OVERFLOW_CAP_RATIO = 0.06;

export const UPGRADES = [
  { id: 'pillow', name: 'やわらかい枕', description: 'タップの羊が1.55倍。', baseCost: 18, scale: 1.78, repeatable: true, unlockDepth: 0 },
  { id: 'jumper', name: '勝手に跳ぶ羊', description: '毎秒0.65匹の羊が柵を跳ぶ。', baseCost: 24, scale: 1.8, repeatable: true, unlockDepth: 0 },
  { id: 'flock', name: '雲から来る群れ', description: '毎秒2.4匹の群れが流れ込む。', baseCost: 120, scale: 1.95, repeatable: true, unlockDepth: 1 },
  { id: 'recursive', name: '羊が羊を数える', description: '自動カウントが2.2倍。', baseCost: 950, scale: 1, repeatable: false, unlockDepth: 2 },
  { id: 'drowse', name: '夢うつつ', description: 'すべてのカウントが1.6倍。', baseCost: 6_500, scale: 1, repeatable: false, unlockDepth: 3 },
];

export const LAWS = [
  { id: 'skipFence', depth: 1, cost: 1, name: '柵を飛ばなくても数えてよい', description: 'すべてのカウントが1.35倍。' },
  { id: 'doubleCount', depth: 2, cost: 2, name: '一度に二匹まで数えてよい', description: 'タップのカウントが1.6倍。' },
  { id: 'countCounters', depth: 3, cost: 3, name: '数えられた羊も数えてよい', description: '自動カウントが1.8倍。' },
  { id: 'notSheep', depth: 4, cost: 4, name: '羊ではないものも数えてよい', description: 'すべてのカウントが1.45倍。月も雲も、たぶん羊。' },
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
    lastPrestigeCarry: 0,
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
  if (depth >= MAX_SLEEP_DEPTH) return PRESTIGE_TARGETS.at(-1);
  return PRESTIGE_TARGETS[Math.max(0, Math.floor(depth))];
}

export function depthProfile(depth) {
  return DEPTH_PROFILES[Math.min(MAX_SLEEP_DEPTH, Math.max(0, Math.floor(depth)))] || DEPTH_PROFILES[0];
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
  const phase = depthProfile(state.sleepDepth);
  const lawGlobal = state.laws.skipFence ? 1.35 : 1;
  const manualLaw = state.laws.doubleCount ? 1.6 : 1;
  const autoLaw = state.laws.countCounters ? 1.8 : 1;
  const notSheep = state.laws.notSheep ? 1.45 : 1;
  const drowse = state.runUpgrades.drowse ? 1.6 : 1;
  const global = phase.global * lawGlobal * notSheep * drowse;
  return {
    global,
    manualExtra: phase.manual * manualLaw,
    autoExtra: phase.auto * autoLaw,
  };
}

export function clickValue(state) {
  const { global, manualExtra } = getModifiers(state);
  return (1.55 ** state.runUpgrades.pillow) * global * manualExtra;
}

export function autoRate(state) {
  const { global, autoExtra } = getModifiers(state);
  const base = (state.runUpgrades.jumper * 0.65) + (state.runUpgrades.flock * 2.4);
  const recursive = state.runUpgrades.recursive ? 2.2 : 1;
  return base * recursive * autoExtra * global;
}

function gainSheep(state, amount) {
  if (amount <= 0 || state.ended) return state;
  return { ...state, sheep: state.sheep + amount, lifetimeSheep: state.lifetimeSheep + amount };
}

export function manualCount(state) {
  if (state.ended) return state;
  const next = gainSheep(state, clickValue(state));
  return { ...next, manualClicks: next.manualClicks + 1 };
}

export function tick(state, deltaSeconds) {
  if (state.ended || deltaSeconds <= 0) return state;
  const dt = Math.min(deltaSeconds, 60 * 60 * 4);
  const next = gainSheep(state, autoRate(state) * dt);
  return { ...next, elapsedSeconds: next.elapsedSeconds + dt };
}

export function canBuyUpgrade(state, upgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade || state.ended || state.sleepDepth < upgrade.unlockDepth) return false;
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

export function prestigeCarry(state) {
  if (!canDeepenSleep(state)) return 0;
  const excess = Math.max(0, state.sheep - prestigeTarget(state.sleepDepth));
  const nextTarget = prestigeTarget(state.sleepDepth + 1);
  return Math.floor(Math.min(excess * OVERFLOW_EFFICIENCY, nextTarget * OVERFLOW_CAP_RATIO));
}

export function deepenSleep(state) {
  if (!canDeepenSleep(state)) return state;
  const award = state.sleepDepth + 1;
  const nextDepth = state.sleepDepth + 1;
  const carry = prestigeCarry(state);
  let next = {
    ...state,
    sheep: carry,
    sleepDepth: nextDepth,
    dreamShards: state.dreamShards + award,
    lastPrestigeCarry: carry,
    runUpgrades: blankRunUpgrades(),
  };
  const carryText = carry > 0 ? ` 余った羊から${carry.toLocaleString('ja-JP')}匹が夢に残った。` : '';
  next = addEvent(next, `眠りが一段深くなった。夢のかけら +${award}。${carryText}`);
  if (nextDepth === 1) next = addEvent(next, '雲の寝床へ。群れを呼べるようになった。');
  if (nextDepth === 2) next = addEvent(next, '星の牧草地へ。羊たちが互いを数え始める。');
  if (nextDepth === 3) next = addEvent(next, '数える深海へ。手と群れのリズムが重なっていく。');
  if (nextDepth === 4) next = addEvent(next, '朝のふちへ。月も雲も、もう羊に見える。');
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
  const next = {
    ...state,
    dreamShards: state.dreamShards - law.cost,
    laws: { ...state.laws, [lawId]: true },
  };
  return addEvent(next, `夢の法則を書き換えた：「${law.name}」`);
}

export function canWake(state) {
  return !state.ended && state.sleepDepth >= MAX_SLEEP_DEPTH && Boolean(state.laws.notSheep);
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

function migrateSave(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version === SAVE_VERSION) return raw;
  if (raw.version === 1) return { ...raw, version: SAVE_VERSION, lastPrestigeCarry: 0 };
  return null;
}

export function normalizeState(raw, now = Date.now()) {
  const migrated = migrateSave(raw);
  if (!migrated) return createInitialState(now);
  const base = createInitialState(migrated.startedAt || now);
  const next = {
    ...base,
    ...migrated,
    runUpgrades: { ...base.runUpgrades, ...(migrated.runUpgrades || {}) },
    laws: { ...(migrated.laws || {}) },
    eventLog: Array.isArray(migrated.eventLog) ? migrated.eventLog.slice(0, 12) : base.eventLog,
    lastSavedAt: migrated.lastSavedAt || now,
    version: SAVE_VERSION,
  };
  const finiteNonNegative = (value, fallback = 0) => (
    Number.isFinite(value) && value >= 0 ? value : fallback
  );
  next.sheep = finiteNonNegative(next.sheep);
  next.lifetimeSheep = Math.max(next.sheep, finiteNonNegative(next.lifetimeSheep));
  next.manualClicks = Math.floor(finiteNonNegative(next.manualClicks));
  next.sleepDepth = Math.min(MAX_SLEEP_DEPTH, Math.floor(finiteNonNegative(next.sleepDepth)));
  next.dreamShards = Math.floor(finiteNonNegative(next.dreamShards));
  next.lastPrestigeCarry = Math.floor(finiteNonNegative(next.lastPrestigeCarry));
  next.elapsedSeconds = finiteNonNegative(next.elapsedSeconds);
  next.startedAt = finiteNonNegative(next.startedAt, now);
  next.lastSavedAt = finiteNonNegative(next.lastSavedAt, now);
  for (const upgrade of UPGRADES) {
    const level = Math.floor(finiteNonNegative(next.runUpgrades[upgrade.id]));
    next.runUpgrades[upgrade.id] = upgrade.repeatable ? Math.min(level, 100) : Math.min(1, level);
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

export function debugBoost(state, sheep = 1_000_000, shards = 10) {
  return { ...state, sheep: state.sheep + sheep, dreamShards: state.dreamShards + shards };
}
