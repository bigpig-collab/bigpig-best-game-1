// Arena and entity rendering: background grid, vignette, screens, overlays.
import { CFG } from './config.js';

export function drawArena(ctx, time, shakeX, shakeY) {
  ctx.save();
  ctx.translate(shakeX, shakeY);
  // Deep violet gradient.
  const g = ctx.createRadialGradient(640, 400, 80, 640, 400, 760);
  g.addColorStop(0, CFG.COLORS.bg2);
  g.addColorStop(1, CFG.COLORS.bg);
  ctx.fillStyle = g;
  ctx.fillRect(-20, -20, CFG.W + 40, CFG.H + 40);
  // Faint grid.
  ctx.strokeStyle = CFG.COLORS.grid;
  ctx.lineWidth = 1;
  const step = 64;
  ctx.beginPath();
  for (let x = step; x < CFG.W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); }
  for (let y = step; y < CFG.H; y += step) { ctx.moveTo(0, y); ctx.lineTo(CFG.W, y); }
  ctx.stroke();
  // Pulsing arena border.
  const pulse = 0.5 + Math.sin(time * 2) * 0.2;
  ctx.strokeStyle = `rgba(124, 92, 255, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.strokeRect(CFG.ARENA_MARGIN - 14, CFG.ARENA_MARGIN - 14, CFG.W - 2 * (CFG.ARENA_MARGIN - 14), CFG.H - 2 * (CFG.ARENA_MARGIN - 14));
  // Corner stars.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 173) % CFG.W;
    const sy = (i * 311) % CFG.H;
    const tw = 0.5 + Math.sin(time * 3 + i) * 0.5;
    ctx.globalAlpha = 0.12 + tw * 0.25;
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

function centerText(ctx, text, x, y, font, color, glow) {
  ctx.save();
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (glow) { ctx.shadowBlur = 24; ctx.shadowColor = glow; }
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function button(ctx, x, y, w, h, label, accent) {
  ctx.save();
  ctx.fillStyle = 'rgba(28, 17, 64, 0.92)';
  ctx.strokeStyle = accent || CFG.COLORS.cardEdge;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
  ctx.fill(); ctx.stroke();
  centerText(ctx, label, x, y + 1, 'bold 22px system-ui, sans-serif', CFG.COLORS.text);
  ctx.restore();
  return { x: x - w / 2, y: y - h / 2, w, h };
}

export function drawTitle(ctx, time, best) {
  ctx.fillStyle = 'rgba(5, 2, 16, 0.55)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  const bob = Math.sin(time * 2) * 8;
  centerText(ctx, 'VOIDFALL', 640, 210 + bob, '900 96px system-ui, sans-serif', '#22e6ff', '#22e6ff');
  centerText(ctx, 'NEON ARENA SURVIVAL', 640, 282 + bob, 'bold 26px system-ui, sans-serif', '#ff4d8d', '#ff4d8d');
  centerText(ctx, 'Survive 10 waves. Slay the VOIDMAW. Fall into the void — or master it.', 640, 340, '18px system-ui, sans-serif', CFG.COLORS.dim);
  const lines = [
    'WASD / ARROWS — move      MOUSE — aim      HOLD CLICK / SPACE — fire',
    'SHIFT — dash (brief invulnerability)      E — nova bomb',
    'Kill enemies, grab XP shards, pick 1 of 3 upgrades on every level-up',
    'P / ESC — pause      M — mute',
  ];
  lines.forEach((l, i) => centerText(ctx, l, 640, 400 + i * 30, '17px system-ui, sans-serif', CFG.COLORS.text));
  if (best > 0) centerText(ctx, 'BEST SCORE: ' + best.toLocaleString(), 640, 540, 'bold 22px system-ui, sans-serif', CFG.COLORS.shard);
  const btn = button(ctx, 640, 620, 300, 62, '▶  START GAME', '#22e6ff');
  centerText(ctx, 'or press ENTER', 640, 672, '15px system-ui, sans-serif', CFG.COLORS.dim);
  return { start: btn };
}

export function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(5, 2, 16, 0.72)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  centerText(ctx, 'PAUSED', 640, 330, '900 72px system-ui, sans-serif', CFG.COLORS.text, '#7c5cff');
  centerText(ctx, 'Press P or ESC to resume', 640, 410, '20px system-ui, sans-serif', CFG.COLORS.dim);
  const btn = button(ctx, 640, 490, 260, 56, 'RESUME');
  return { resume: btn };
}

export function drawGameOver(ctx, score, wave, best, isNewBest) {
  ctx.fillStyle = 'rgba(20, 2, 10, 0.78)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  centerText(ctx, 'GAME OVER', 640, 220, '900 84px system-ui, sans-serif', '#ff3b5c', '#ff3b5c');
  centerText(ctx, 'The void claims another pilot.', 640, 290, '20px system-ui, sans-serif', CFG.COLORS.dim);
  centerText(ctx, 'SCORE  ' + score.toLocaleString(), 640, 370, 'bold 40px system-ui, sans-serif', CFG.COLORS.text);
  centerText(ctx, 'WAVE REACHED  ' + wave + '      BEST  ' + best.toLocaleString(), 640, 425, '22px system-ui, sans-serif', CFG.COLORS.shard);
  if (isNewBest) centerText(ctx, '★ NEW BEST SCORE ★', 640, 470, 'bold 26px system-ui, sans-serif', CFG.COLORS.shard, '#ffd94d');
  const btn = button(ctx, 640, 560, 300, 62, '↻  PLAY AGAIN', '#22e6ff');
  centerText(ctx, 'or press ENTER', 640, 612, '15px system-ui, sans-serif', CFG.COLORS.dim);
  return { restart: btn };
}

export function drawVictory(ctx, score, best) {
  ctx.fillStyle = 'rgba(4, 12, 8, 0.78)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  centerText(ctx, 'VICTORY', 640, 210, '900 92px system-ui, sans-serif', '#2dff7a', '#2dff7a');
  centerText(ctx, 'VOIDMAW DESTROYED — the arena is yours, pilot.', 640, 285, '22px system-ui, sans-serif', CFG.COLORS.text);
  centerText(ctx, 'FINAL SCORE  ' + score.toLocaleString(), 640, 360, 'bold 40px system-ui, sans-serif', CFG.COLORS.text);
  centerText(ctx, 'BEST  ' + best.toLocaleString(), 640, 412, '22px system-ui, sans-serif', CFG.COLORS.shard);
  const endlessBtn = button(ctx, 640, 500, 340, 60, 'CONTINUE — ENDLESS MODE');
  const restartBtn = button(ctx, 640, 585, 300, 60, '↻  PLAY AGAIN');
  return { endless: endlessBtn, restart: restartBtn };
}

export function drawUpgradeOverlay(ctx, choices, level) {
  ctx.fillStyle = 'rgba(5, 2, 16, 0.66)';
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  centerText(ctx, 'LEVEL UP!', 640, 150, '900 64px system-ui, sans-serif', CFG.COLORS.shard, '#ffd94d');
  centerText(ctx, 'You reached level ' + level + ' — choose one upgrade', 640, 205, '20px system-ui, sans-serif', CFG.COLORS.text);
  const rects = [];
  const cw = 300, ch = 250, gap = 36;
  const total = cw * 3 + gap * 2;
  const x0 = (CFG.W - total) / 2;
  choices.forEach((u, i) => {
    const x = x0 + i * (cw + gap);
    const y = 260;
    ctx.save();
    ctx.fillStyle = CFG.COLORS.card;
    ctx.strokeStyle = u.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x, y, cw, ch, 14);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 18; ctx.shadowColor = u.color;
    ctx.fillStyle = u.color;
    ctx.font = '900 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(u.icon, x + cw / 2, y + 62);
    ctx.shadowBlur = 0;
    ctx.fillStyle = CFG.COLORS.text;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(u.name, x + cw / 2, y + 112);
    ctx.fillStyle = CFG.COLORS.dim;
    ctx.font = '17px system-ui, sans-serif';
    wrapText(ctx, u.desc, x + cw / 2, y + 152, cw - 36, 24);
    ctx.fillStyle = u.color;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('Press ' + (i + 1) + ' or click', x + cw / 2, y + ch - 26);
    ctx.restore();
    rects.push({ x, y, w: cw, h: ch, index: i });
  });
  return rects;
}

function wrapText(ctx, text, cx, y, maxW, lh) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lh));
}

export function drawWaveBanner(ctx, text, alpha) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  centerText(ctx, text, 640, 300, '900 56px system-ui, sans-serif', '#f2ecff', '#7c5cff');
  ctx.restore();
}
