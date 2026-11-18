// The player ship: movement, dash with i-frames, nova bomb, XP and levels.
import { CFG } from './config.js';
import { clamp, angleTo } from './random.js';

export function createPlayer() {
  const p = {
    x: CFG.W / 2, y: CFG.H / 2, radius: CFG.PLAYER_RADIUS,
    vx: 0, vy: 0, aim: -Math.PI / 2,
    hp: CFG.PLAYER_HP, maxHp: CFG.PLAYER_HP,
    shield: CFG.PLAYER_SHIELD, maxShield: CFG.PLAYER_SHIELD,
    speed: CFG.PLAYER_SPEED,
    fireRate: CFG.PLAYER_FIRE_RATE,
    damage: CFG.PLAYER_DAMAGE,
    multishot: 1,
    pierce: 0,
    critChance: 0.05,
    magnet: CFG.XP_MAGNET,
    fireTimer: 0,
    dashTimer: 0, dashCooldown: 0, dashDirX: 1, dashDirY: 0,
    invuln: 0, hurtFlash: 0,
    novaCharges: CFG.NOVA_CHARGES, maxNova: CFG.NOVA_CHARGES,
    xp: 0, level: 1, xpNext: CFG.LEVEL_BASE_XP,
    alive: true,
  };
  return p;
}

export function updatePlayer(p, input, dt, audio, onNova) {
  p.aim = angleTo(p.x, p.y, input.mouseX, input.mouseY);
  const mv = input.moveVector();

  if (p.dashCooldown > 0) p.dashCooldown -= dt;
  if (p.invuln > 0) p.invuln -= dt;
  if (p.hurtFlash > 0) p.hurtFlash -= dt;

  // Dash: Shift, quick burst with invulnerability.
  if (input.wasPressed('shift') && p.dashCooldown <= 0 && (mv.x !== 0 || mv.y !== 0)) {
    p.dashTimer = CFG.DASH_TIME;
    p.dashCooldown = CFG.DASH_COOLDOWN;
    p.dashDirX = mv.x; p.dashDirY = mv.y;
    p.invuln = Math.max(p.invuln, CFG.DASH_TIME + 0.08);
    if (audio) audio.dash();
  }

  if (p.dashTimer > 0) {
    p.dashTimer -= dt;
    p.x += p.dashDirX * CFG.DASH_SPEED * dt;
    p.y += p.dashDirY * CFG.DASH_SPEED * dt;
  } else {
    p.x += mv.x * p.speed * dt;
    p.y += mv.y * p.speed * dt;
  }
  p.x = clamp(p.x, CFG.ARENA_MARGIN, CFG.W - CFG.ARENA_MARGIN);
  p.y = clamp(p.y, CFG.ARENA_MARGIN, CFG.H - CFG.ARENA_MARGIN);

  // Shield slowly regenerates.
  if (p.shield < p.maxShield) p.shield = Math.min(p.maxShield, p.shield + CFG.SHIELD_REGEN * dt);

  // Nova bomb on E.
  if (input.wasPressed('e') && p.novaCharges > 0 && onNova) {
    p.novaCharges--;
    onNova();
  }

  // Firing.
  p.fireTimer -= dt;
  const firing = input.mouseDown || input.down(' ');
  if (firing && p.fireTimer <= 0) {
    p.fireTimer = 1 / p.fireRate;
    return true; // main loop spawns the bullets
  }
  return false;
}

export function gainXp(p, amount) {
  p.xp += amount;
  let leveled = false;
  while (p.xp >= p.xpNext) {
    p.xp -= p.xpNext;
    p.level++;
    p.xpNext = Math.round(p.xpNext * CFG.LEVEL_XP_GROWTH + 4);
    leveled = true;
  }
  return leveled;
}

export function damagePlayer(p, amount) {
  if (p.invuln > 0 || !p.alive) return false;
  let rest = amount;
  if (p.shield > 0) {
    const absorbed = Math.min(p.shield, rest);
    p.shield -= absorbed;
    rest -= absorbed;
  }
  p.hp -= rest;
  p.hurtFlash = 0.35;
  p.invuln = 0.5;
  if (p.hp <= 0) { p.hp = 0; p.alive = false; }
  return true;
}

export function drawPlayer(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.invuln > 0 && p.dashTimer <= 0 && Math.floor(time * 20) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.shadowBlur = 22;
  ctx.shadowColor = CFG.COLORS.player;
  // Shield ring.
  if (p.shield > 0.5) {
    ctx.globalAlpha *= 1;
    ctx.strokeStyle = 'rgba(56, 182, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 9, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.rotate(p.aim);
  // Hull: sleek arrow ship.
  ctx.fillStyle = CFG.COLORS.player;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.lineTo(-12, -13);
  ctx.lineTo(-6, 0);
  ctx.lineTo(-12, 13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = CFG.COLORS.playerCore;
  ctx.beginPath();
  ctx.arc(2, 0, 6, 0, Math.PI * 2);
  ctx.fill();
  // Engine flame flicker.
  const flame = 8 + Math.sin(time * 40) * 3;
  ctx.fillStyle = '#ff9f1c';
  ctx.beginPath();
  ctx.moveTo(-12, -5);
  ctx.lineTo(-12 - flame, 0);
  ctx.lineTo(-12, 5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
