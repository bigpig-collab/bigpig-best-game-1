// Level-up upgrade cards: the pool, rolling three distinct choices, applying one.
export const UPGRADE_POOL = [
  { id: 'damage', name: 'OVERCHARGE', desc: '+25% bullet damage', icon: 'DMG', color: '#ff5a3c', apply: (p) => { p.damage *= 1.25; } },
  { id: 'firerate', name: 'RAPID CYCLER', desc: '+18% fire rate', icon: 'RPM', color: '#7df9ff', apply: (p) => { p.fireRate *= 1.18; } },
  { id: 'multishot', name: 'TRIPLE HELIX', desc: '+1 projectile per shot', icon: 'x3', color: '#22e6ff', max: 3, apply: (p) => { p.multishot += 1; } },
  { id: 'pierce', name: 'LANCE ROUNDS', desc: 'Bullets pierce +1 enemy', icon: '>>', color: '#ffd94d', max: 3, apply: (p) => { p.pierce += 1; } },
  { id: 'speed', name: 'ION THRUSTERS', desc: '+12% move speed', icon: 'SPD', color: '#2dff7a', apply: (p) => { p.speed *= 1.12; } },
  { id: 'maxhp', name: 'VOID PLATING', desc: '+25 max HP and heal 25', icon: 'HP', color: '#ff4d8d', apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.maxHp, p.hp + 25); } },
  { id: 'shield', name: 'AEGIS FIELD', desc: '+20 max shield, faster regen', icon: 'SHD', color: '#38b6ff', apply: (p) => { p.maxShield += 20; p.shield = p.maxShield; } },
  { id: 'magnet', name: 'TRACTOR WEB', desc: '+60% XP pickup radius', icon: 'MAG', color: '#b26bff', apply: (p) => { p.magnet *= 1.6; } },
  { id: 'crit', name: 'DEADEYE', desc: '+12% critical chance (crits deal 2x)', icon: 'CRIT', color: '#ff9f1c', max: 4, apply: (p) => { p.critChance += 0.12; } },
  { id: 'nova', name: 'NOVA CELL', desc: '+1 nova bomb charge', icon: 'NOVA', color: '#aefcff', max: 3, apply: (p) => { p.maxNova += 1; p.novaCharges += 1; } },
  { id: 'heal', name: 'REPAIR SWARM', desc: 'Restore 40 HP now', icon: '+40', color: '#2dff7a', apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 40); } },
  { id: 'dash', name: 'PHASE DASH', desc: 'Dash recharges 35% faster', icon: 'DASH', color: '#d9a0ff', apply: (p) => { p.dashCooldown = Math.max(0.3, p.dashCooldown * 0.65); } },
];

export function rollUpgrades(taken, rng) {
  const counts = {};
  for (const id of taken) counts[id] = (counts[id] || 0) + 1;
  const available = UPGRADE_POOL.filter((u) => !u.max || (counts[u.id] || 0) < u.max);
  const pool = available.length >= 3 ? available : UPGRADE_POOL;
  const picks = [];
  const copy = pool.slice();
  while (picks.length < 3 && copy.length > 0) {
    const i = Math.floor(rng.next() * copy.length);
    picks.push(copy.splice(i, 1)[0]);
  }
  return picks;
}

export function applyUpgrade(player, upgrade, taken) {
  upgrade.apply(player);
  taken.push(upgrade.id);
}
