// Enemies: chasers, shooters, splitters, tanks and the VOIDMAW boss.
import { CFG, ENEMY_TYPES } from './config.js';
import { angleTo, dist2, clamp } from './random.js';

let nextId = 1;

export function spawnEnemy(kind, x, y, wave) {
  const base = ENEMY_TYPES[kind];
  const hpScale = 1 + (wave - 1) * 0.16 + Math.max(0, wave - 5) * 0.1;
  const speedScale = 1 + Math.min(0.35, (wave - 1) * 0.03);
  return {
    id: nextId++, kind,
    x, y, radius: base.radius,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    speed: base.speed * speedScale,
    score: base.score, xp: base.xp, contact: base.contact,
    color: base.color,
    flash: 0, shootTimer: 1.2 + Math.random() * 1.2,
    wobble: Math.random() * Math.PI * 2,
    summonTimer: 6, burstTimer: 2.5, pattern: 0,
  };
}

export function edgeSpawn(wave, rng) {
  const side = rng.int(0, 3);
  const m = CFG.ARENA_MARGIN + 10;
  if (side === 0) return { x: rng.range(m, CFG.W - m), y: m };
  if (side === 1) return { x: rng.range(m, CFG.W - m), y: CFG.H - m };
  if (side === 2) return { x: m, y: rng.range(m, CFG.H - m) };
  return { x: CFG.W - m, y: rng.range(m, CFG.H - m) };
}

export function updateEnemies(enemies, player, dt, time, fireEnemy, spawnMinion) {
  for (const e of enemies) {
    if (e.flash > 0) e.flash -= dt;
    const d = Math.hypot(player.x - e.x, player.y - e.y) || 1;
    const ang = angleTo(e.x, e.y, player.x, player.y);
    e.wobble += dt * 2;

    if (e.kind === 'drifter' || e.kind === 'mini') {
      e.x += Math.cos(ang) * e.speed * dt;
      e.y += Math.sin(ang) * e.speed * dt;
    } else if (e.kind === 'spitter') {
      // Keep a mid range, strafe sideways, shoot.
      const want = 300;
      const radial = d > want + 40 ? 1 : d < want - 40 ? -1 : 0;
      const strafe = Math.sin(e.wobble) * 0.8;
      e.x += (Math.cos(ang) * radial + Math.cos(ang + Math.PI / 2) * strafe) * e.speed * dt;
      e.y += (Math.sin(ang) * radial + Math.sin(ang + Math.PI / 2) * strafe) * e.speed * dt;
      e.shootTimer -= dt;
      if (e.shootTimer <= 0 && d < 560) {
        e.shootTimer = 2.4;
        fireEnemy(e.x, e.y, ang, 240, 8, 7);
      }
    } else if (e.kind === 'splitter') {
      e.x += Math.cos(ang + Math.sin(e.wobble) * 0.4) * e.speed * dt;
      e.y += Math.sin(ang + Math.sin(e.wobble) * 0.4) * e.speed * dt;
    } else if (e.kind === 'tank') {
      e.x += Math.cos(ang) * e.speed * dt;
      e.y += Math.sin(ang) * e.speed * dt;
    } else if (e.kind === 'boss') {
      // VOIDMAW: slow approach, radial bursts, summons.
      e.x += Math.cos(ang) * e.speed * dt * (d > 180 ? 1 : 0.2);
      e.y += Math.sin(ang) * e.speed * dt * (d > 180 ? 1 : 0.2);
      e.burstTimer -= dt;
      if (e.burstTimer <= 0) {
        e.burstTimer = 2.8;
        e.pattern = (e.pattern + 1) % 3;
        const n = 10 + e.pattern * 4;
        const off = Math.random() * Math.PI * 2;
        for (let i = 0; i < n; i++) {
          const a = off + (i / n) * Math.PI * 2;
          fireEnemy(e.x, e.y, a, 190, 10, 8);
        }
        if (e.pattern === 2) {
          for (let i = 0; i < 5; i++) fireEnemy(e.x, e.y, ang + (i - 2) * 0.22, 300, 10, 8);
        }
      }
      e.summonTimer -= dt;
      if (e.summonTimer <= 0) {
        e.summonTimer = 7;
        spawnMinion(e.x, e.y);
      }
    }
    e.x = clamp(e.x, 24, CFG.W - 24);
    e.y = clamp(e.y, 24, CFG.H - 24);
  }
}

export function drawEnemies(ctx, enemies, time) {
  for (const e of enemies) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.shadowBlur = 16;
    ctx.shadowColor = e.color;
    const flash = e.flash > 0;
    ctx.fillStyle = flash ? '#ffffff' : e.color;
    ctx.strokeStyle = flash ? '#ffffff' : e.color;
    if (e.kind === 'drifter') {
      // Spiky orb.
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + time * 1.5;
        const r = i % 2 === 0 ? e.radius + 6 : e.radius - 3;
        const px = Math.cos(a) * r, py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2a0a1e';
      ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'spitter') {
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a1c00';
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'splitter') {
      const pulse = 1 + Math.sin(time * 6 + e.wobble) * 0.08;
      ctx.scale(pulse, pulse);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const px = Math.cos(a) * e.radius, py = Math.sin(a) * e.radius;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#efe6ff';
      ctx.beginPath(); ctx.arc(-6, -4, 4, 0, Math.PI * 2); ctx.arc(7, 3, 4, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'mini') {
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'tank') {
      ctx.lineWidth = 5;
      ctx.strokeRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      ctx.fillStyle = 'rgba(255, 90, 60, 0.35)';
      ctx.fillRect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      ctx.fillStyle = '#ffd0c0';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    } else if (e.kind === 'boss') {
      // VOIDMAW: huge rotating maw with teeth.
      ctx.rotate(time * 0.5);
      ctx.beginPath(); ctx.arc(0, 0, e.radius, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a0512';
      const mouth = 0.55 + Math.sin(time * 3) * 0.12;
      ctx.beginPath(); ctx.arc(0, 0, e.radius * mouth, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * e.radius * 0.72, Math.sin(a) * e.radius * 0.72, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ff2e63';
      ctx.beginPath(); ctx.arc(0, 0, e.radius * 0.28, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
    // HP bar for tough enemies.
    if ((e.kind === 'tank' || e.kind === 'boss' || e.kind === 'splitter') && e.hp < e.maxHp) {
      const w = e.kind === 'boss' ? 110 : 44;
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, w, 6);
      ctx.fillStyle = '#ff3b5c';
      ctx.fillRect(e.x - w / 2, e.y - e.radius - 14, w * (e.hp / e.maxHp), 6);
    }
  }
}

export function enemiesTouchingPlayer(enemies, player) {
  const hits = [];
  for (const e of enemies) {
    if (dist2(e.x, e.y, player.x, player.y) < (e.radius + player.radius - 4) ** 2) hits.push(e);
  }
  return hits;
}
