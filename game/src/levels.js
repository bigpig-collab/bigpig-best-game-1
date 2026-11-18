// Wave composition and the boss schedule: which enemies appear, how many, when.
import { CFG } from './config.js';

// Composition for a wave: counts per kind, growing with wave number.
export function waveComposition(wave) {
  const comp = [];
  const add = (kind, n) => { if (n > 0) comp.push({ kind, count: n }); };
  add('drifter', 4 + wave * 2);
  add('spitter', wave >= 2 ? 1 + Math.floor(wave * 0.8) : 0);
  add('splitter', wave >= 3 ? 1 + Math.floor(wave * 0.6) : 0);
  add('tank', wave >= 4 ? Math.floor((wave - 2) * 0.7) : 0);
  if (wave % 5 === 0) add('boss', 1);
  return comp;
}

export function isBossWave(wave) { return wave % 5 === 0; }

// Flat spawn queue for a wave (boss last so it enters after the pack).
export function buildSpawnQueue(wave) {
  const queue = [];
  for (const { kind, count } of waveComposition(wave)) {
    for (let i = 0; i < count; i++) queue.push(kind);
  }
  // Shuffle everything except the boss, which stays last.
  const boss = queue.filter((k) => k === 'boss');
  const rest = queue.filter((k) => k !== 'boss');
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return rest.concat(boss);
}

export function waveName(wave) {
  if (wave % 5 === 0) return 'VOIDMAW AWAKENS';
  if (wave === CFG.VICTORY_WAVE) return 'FINAL WAVE';
  return 'WAVE ' + wave;
}
