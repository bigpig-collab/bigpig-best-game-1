// HUD: health, shield, wave, score, combo, XP bar, nova charges, boss bar.
import { CFG } from './config.js';

export function drawHud(ctx, g) {
  const p = g.player;
  ctx.save();
  // Top-left: HP + shield bars.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillStyle = CFG.COLORS.text;
  ctx.fillText('HP', 24, 30);
  bar(ctx, 78, 18, 200, 18, p.hp / p.maxHp, CFG.COLORS.hp);
  ctx.fillStyle = CFG.COLORS.text;
  ctx.fillText(Math.ceil(p.hp) + ' / ' + p.maxHp, 290, 30);
  ctx.fillStyle = CFG.COLORS.text;
  ctx.fillText('SHIELD', 24, 58);
  bar(ctx, 78, 46, 200, 14, p.shield / p.maxShield, CFG.COLORS.shield);

  // Top-center: wave + score.
  ctx.textAlign = 'center';
  ctx.font = '900 30px system-ui, sans-serif';
  ctx.fillStyle = CFG.COLORS.text;
  ctx.fillText('WAVE ' + g.wave, 640, 32);
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillStyle = CFG.COLORS.shard;
  ctx.fillText('SCORE ' + g.score.toLocaleString(), 640, 62);

  // Top-right: combo + nova.
  ctx.textAlign = 'right';
  ctx.font = 'bold 20px system-ui, sans-serif';
  if (g.combo > 1) {
    ctx.fillStyle = g.combo >= 5 ? '#ff9f1c' : CFG.COLORS.text;
    ctx.fillText('COMBO x' + g.combo, 1256, 30);
  }
  ctx.fillStyle = CFG.COLORS.text;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText('NOVA  ' + '◆'.repeat(p.novaCharges) + '◇'.repeat(Math.max(0, p.maxNova - p.novaCharges)) + '  [E]', 1256, 58);

  // Bottom: XP bar + level.
  const xpW = 560;
  const xpX = (CFG.W - xpW) / 2;
  ctx.textAlign = 'center';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillStyle = CFG.COLORS.text;
  ctx.fillText('LV ' + p.level, xpX - 34, CFG.H - 26);
  bar(ctx, xpX, CFG.H - 36, xpW, 12, p.xp / p.xpNext, '#b26bff');
  ctx.fillStyle = CFG.COLORS.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('XP ' + p.xp + ' / ' + p.xpNext, xpX + xpW + 52, CFG.H - 26);

  // Boss HP bar.
  const boss = g.enemies.find((e) => e.kind === 'boss');
  if (boss) {
    ctx.textAlign = 'center';
    ctx.font = '900 22px system-ui, sans-serif';
    ctx.fillStyle = '#ff2e63';
    ctx.fillText('VOIDMAW', 640, 108);
    bar(ctx, 440, 122, 400, 14, Math.max(0, boss.hp / boss.maxHp), '#ff2e63');
  }

  // Breather countdown.
  if (g.state === 'breather') {
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillStyle = CFG.COLORS.text;
    ctx.fillText('Next wave in ' + Math.ceil(g.breatherTimer) + '…', 640, 160);
  }

  // Low HP warning.
  if (p.hp <= 30 && p.alive) {
    const a = 0.25 + Math.sin(g.time * 6) * 0.12;
    ctx.strokeStyle = `rgba(255, 59, 92, ${a})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, CFG.W - 8, CFG.H - 8);
  }
  ctx.restore();
}

function bar(ctx, x, y, w, h, frac, color) {
  const f = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.fill();
  if (f > 0) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(h, w * f), h, h / 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, h / 2);
  ctx.stroke();
}
