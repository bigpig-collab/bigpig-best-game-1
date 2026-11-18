// Deterministic staged scenes for screenshots: ?shot=title|action|upgrade|gameover&seed=N
// Each builds a fixed scene with a seeded RNG and renders exactly one frame.
import { makeRng } from './random.js';
import { CFG } from './config.js';
import { spawnEnemy } from './enemies.js';
import { rollUpgrades } from './upgrades.js';
import { drawArena, drawTitle, drawGameOver, drawUpgradeOverlay } from './render.js';
import { drawPlayer } from './player.js';
import { drawEnemies } from './enemies.js';
import { drawHud } from './hud.js';

export function getShotParams() {
  const q = new URLSearchParams(window.location.search);
  return { shot: q.get('shot'), seed: Number(q.get('seed') || '1337') };
}

export function stageShot(g, shot, seed) {
  const rng = makeRng(seed);
  g.time = 12.5;
  g.best = 12450;

  if (shot === 'title') {
    g.state = 'title';
    g.score = 0; g.wave = 1;
    // A few decorative drifters floating behind the title.
    g.enemies = [
      spawnEnemy('drifter', 220, 620, 1),
      spawnEnemy('spitter', 1060, 600, 1),
      spawnEnemy('splitter', 980, 180, 1),
      spawnEnemy('tank', 180, 200, 1),
    ];
    return { draw: (ctx) => {
      drawArena(ctx, g.time, 0, 0);
      drawEnemies(ctx, g.enemies, g.time);
      // No player ship: at arena centre it overlaps the controls text.
      drawTitle(ctx, g.time, g.best);
    } };
  }

  if (shot === 'action') {
    g.state = 'playing';
    g.wave = 3;
    g.score = 2840;
    g.combo = 5;
    g.comboTimer = 2.2;
    g.player.x = 640; g.player.y = 430;
    g.player.hp = 78; g.player.shield = 26;
    g.player.level = 3; g.player.xp = 9; g.player.xpNext = 26;
    g.player.novaCharges = 2;
    g.player.aim = -0.6;
    const spots = [
      ['drifter', 420, 250], ['drifter', 880, 300], ['spitter', 1020, 180],
      ['splitter', 300, 560], ['tank', 900, 620], ['drifter', 700, 160],
      ['spitter', 200, 380], ['splitter', 1050, 480], ['mini', 520, 620],
    ];
    g.enemies = spots.map(([k, x, y]) => spawnEnemy(k, x, y, 3));
    // Player bullets fanning out, enemy bullets incoming, particles, shards.
    for (let i = 0; i < 10; i++) {
      const a = -0.6 + (i - 4.5) * 0.07;
      const dist = 60 + i * 34;
      g.bullets.firePlayer(640 + Math.cos(a) * dist, 430 + Math.sin(a) * dist, a, 12, 620, 0);
    }
    for (let i = 0; i < 6; i++) {
      const a = rng.angle();
      g.bullets.fireEnemy(1020, 180, a, 240, 8, 7);
    }
    for (let i = 0; i < 9; i++) g.bullets.dropShard(420 + rng.range(-60, 60), 250 + rng.range(-60, 60), 1);
    g.particles.burst(880, 300, '#ff4d8d', 18, 260, 0.7, 4);
    g.particles.burst(520, 620, '#d9a0ff', 12, 200, 0.6, 3);
    g.particles.floatText(700, 200, '24', '#7df9ff');
    g.particles.floatText(880, 280, 'CRIT 48', '#ffd94d', true);
    return { draw: (ctx) => {
      drawArena(ctx, g.time, 0, 0);
      g.bullets.draw(ctx);
      drawEnemies(ctx, g.enemies, g.time);
      drawPlayer(ctx, g.player, g.time);
      g.particles.draw(ctx);
      drawHud(ctx, g);
    } };
  }

  if (shot === 'upgrade') {
    g.state = 'upgrade';
    g.wave = 4;
    g.score = 5120;
    g.combo = 3;
    g.player.x = 640; g.player.y = 620;
    g.player.level = 5; g.player.hp = 64; g.player.shield = 18;
    g.player.xp = 0; g.player.xpNext = 33;
    g.enemies = [
      spawnEnemy('drifter', 300, 300, 4),
      spawnEnemy('spitter', 980, 260, 4),
      spawnEnemy('tank', 880, 640, 4),
    ];
    g.choices = rollUpgrades([], rng);
    return { draw: (ctx) => {
      drawArena(ctx, g.time, 0, 0);
      drawEnemies(ctx, g.enemies, g.time);
      drawPlayer(ctx, g.player, g.time);
      drawHud(ctx, g);
      drawUpgradeOverlay(ctx, g.choices, g.player.level);
    } };
  }

  if (shot === 'gameover') {
    g.state = 'gameover';
    g.score = 8740;
    g.wave = 6;
    g.best = 12450;
    g.isNewBest = false;
    g.enemies = [spawnEnemy('tank', 320, 300, 6), spawnEnemy('drifter', 980, 560, 6)];
    return { draw: (ctx) => {
      drawArena(ctx, g.time, 0, 0);
      drawEnemies(ctx, g.enemies, g.time);
      drawGameOver(ctx, g.score, g.wave, g.best, g.isNewBest);
    } };
  }

  return null;
}
