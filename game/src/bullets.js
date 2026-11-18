// Player and enemy bullets, plus XP shards dropped by kills.
import { CFG } from './config.js';

export function createBullets() {
  const playerBullets = [];
  const enemyBullets = [];
  const shards = [];

  function firePlayer(x, y, angle, damage, speed, pierce, spread) {
    playerBullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, pierce, life: 1.4, spread: spread || 0 });
  }

  function fireEnemy(x, y, angle, speed, damage, radius) {
    enemyBullets.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, damage, radius: radius || 7, life: 5 });
  }

  function dropShard(x, y, value) {
    shards.push({ x: x + (Math.random() - 0.5) * 24, y: y + (Math.random() - 0.5) * 24, value, vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60 });
  }

  function update(dt, player, onShard) {
    for (let i = playerBullets.length - 1; i >= 0; i--) {
      const b = playerBullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 20 || b.x > CFG.W - 20 || b.y < 20 || b.y > CFG.H - 20) playerBullets.splice(i, 1);
    }
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
      const b = enemyBullets[i];
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > CFG.W || b.y < 0 || b.y > CFG.H) enemyBullets.splice(i, 1);
    }
    for (let i = shards.length - 1; i >= 0; i--) {
      const s = shards[i];
      const dx = player.x - s.x, dy = player.y - s.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < player.magnet) {
        const pull = 520 * (1 - d / (player.magnet + 40));
        s.vx += (dx / d) * pull * dt * 4;
        s.vy += (dy / d) * pull * dt * 4;
      } else {
        s.vx *= 0.92; s.vy *= 0.92;
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      if (d < player.radius + 14) {
        onShard(s.value);
        shards.splice(i, 1);
      }
    }
  }

  function draw(ctx) {
    ctx.save();
    ctx.shadowBlur = 10;
    for (const b of playerBullets) {
      ctx.shadowColor = CFG.COLORS.bullet;
      ctx.strokeStyle = CFG.COLORS.bullet;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (const b of enemyBullets) {
      ctx.shadowColor = '#ff5a3c';
      ctx.fillStyle = '#ff7a5c';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd0c0';
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const s of shards) {
      ctx.shadowColor = CFG.COLORS.shard;
      ctx.fillStyle = CFG.COLORS.shard;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-4, -4, 8, 8);
      ctx.restore();
    }
    ctx.restore();
  }

  return { playerBullets, enemyBullets, shards, firePlayer, fireEnemy, dropShard, update, draw };
}
