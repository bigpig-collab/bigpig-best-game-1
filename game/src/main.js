// VOIDFALL — main game loop and state machine.
// States: title / playing / breather / upgrade / paused / gameover / victory.
import { CFG } from './config.js';
import { makeRng, clamp, dist2, angleTo } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createParticles } from './particles.js';
import { createBullets } from './bullets.js';
import { createPlayer, updatePlayer, gainXp, damagePlayer, drawPlayer } from './player.js';
import { spawnEnemy, edgeSpawn, updateEnemies, drawEnemies, enemiesTouchingPlayer } from './enemies.js';
import { rollUpgrades, applyUpgrade } from './upgrades.js';
import { buildSpawnQueue, isBossWave, waveName } from './levels.js';
import { drawArena, drawTitle, drawPaused, drawGameOver, drawVictory, drawUpgradeOverlay, drawWaveBanner } from './render.js';
import { drawHud } from './hud.js';
import { getShotParams, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

const BEST_KEY = 'voidfall-best-score';

const g = {
  state: 'title',
  time: 0,
  score: 0,
  wave: 1,
  best: Number(localStorage.getItem(BEST_KEY) || 0),
  isNewBest: false,
  combo: 0,
  comboTimer: 0,
  kills: 0,
  player: createPlayer(),
  enemies: [],
  bullets: createBullets(),
  particles: createParticles(),
  spawnQueue: [],
  spawnTimer: 0,
  breatherTimer: 0,
  bannerText: '',
  bannerAlpha: 0,
  choices: [],
  takenUpgrades: [],
  shake: 0,
  shakeX: 0,
  shakeY: 0,
  endless: false,
  buttons: {},
  cardRects: [],
  rng: makeRng((Math.random() * 1e9) | 0),
};

function saveBest() {
  if (g.score > g.best) { g.best = g.score; g.isNewBest = true; }
  localStorage.setItem(BEST_KEY, String(g.best));
}

function startGame() {
  g.player = createPlayer();
  g.enemies = [];
  g.bullets = createBullets();
  g.particles = createParticles();
  g.score = 0; g.wave = 0; g.combo = 0; g.comboTimer = 0;
  g.kills = 0; g.isNewBest = false; g.endless = false;
  g.takenUpgrades = [];
  g.shake = 0;
  audio.startMusic();
  nextWave();
  g.state = 'playing';
}

function nextWave() {
  g.wave++;
  g.spawnQueue = buildSpawnQueue(g.wave);
  g.spawnTimer = 0.4;
  g.bannerText = waveName(g.wave);
  g.bannerAlpha = 1;
  if (isBossWave(g.wave)) audio.boss();
}

function startBreather() {
  g.state = 'breather';
  g.breatherTimer = CFG.WAVE_BREATHER;
}

function addScore(base) {
  const mult = Math.max(1, g.combo);
  g.score += base * mult;
}

function killEnemy(e, awardScore) {
  const idx = g.enemies.indexOf(e);
  if (idx === -1) return;
  g.enemies.splice(idx, 1);
  g.particles.burst(e.x, e.y, e.color, e.kind === 'boss' ? 70 : 22, 320, 0.8, 5);
  g.particles.ring(e.x, e.y, e.color, e.kind === 'boss' ? 320 : 120);
  g.shake = Math.max(g.shake, e.kind === 'boss' ? 16 : 6);
  audio.explosion();
  if (awardScore !== false) {
    g.combo = Math.min(CFG.COMBO_MAX, g.combo + 1);
    g.comboTimer = CFG.COMBO_WINDOW;
    addScore(e.score);
    g.kills++;
  }
  for (let i = 0; i < e.xp; i++) g.bullets.dropShard(e.x, e.y, CFG.SHARD_VALUE);
  if (e.kind === 'splitter') {
    for (const [dx, dy] of [[-26, 0], [26, 0]]) {
      const mini = spawnEnemy('mini', clamp(e.x + dx, 40, CFG.W - 40), clamp(e.y + dy, 40, CFG.H - 40), g.wave);
      g.enemies.push(mini);
    }
  }
  if (e.kind === 'boss') {
    g.particles.ring(e.x, e.y, '#ffffff', 420);
    if (g.wave >= CFG.VICTORY_WAVE && !g.endless) {
      saveBest();
      g.state = 'victory';
    }
  }
}

function fireNova() {
  audio.nova();
  g.particles.ring(g.player.x, g.player.y, CFG.COLORS.nova, CFG.NOVA_RADIUS + 60);
  g.shake = Math.max(g.shake, 12);
  for (const e of g.enemies.slice()) {
    const d = Math.hypot(e.x - g.player.x, e.y - g.player.y);
    if (d < CFG.NOVA_RADIUS + e.radius) {
      e.hp -= CFG.NOVA_DAMAGE;
      e.flash = 0.15;
      g.particles.floatText(e.x, e.y - e.radius, String(CFG.NOVA_DAMAGE), '#aefcff');
      if (e.hp <= 0) killEnemy(e);
    }
  }
  g.bullets.enemyBullets.length = 0;
}

function firePlayerBullets() {
  const p = g.player;
  const n = p.multishot;
  const spreadStep = 0.11;
  for (let i = 0; i < n; i++) {
    const off = (i - (n - 1) / 2) * spreadStep;
    g.bullets.firePlayer(
      p.x + Math.cos(p.aim) * 22, p.y + Math.sin(p.aim) * 22,
      p.aim + off, p.damage, CFG.PLAYER_BULLET_SPEED, p.pierce,
    );
  }
  audio.shoot();
}

function updatePlaying(dt) {
  const p = g.player;

  // Spawn from the queue, a few per second.
  if (g.spawnQueue.length > 0) {
    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      g.spawnTimer = 0.35;
      const kind = g.spawnQueue.shift();
      const pos = kind === 'boss' ? { x: CFG.W / 2, y: 110 } : edgeSpawn(g.wave, g.rng);
      g.enemies.push(spawnEnemy(kind, pos.x, pos.y, g.wave));
      g.particles.ring(pos.x, pos.y, '#7c5cff', 60);
    }
  }

  if (updatePlayer(p, input, dt, audio, fireNova)) firePlayerBullets();

  updateEnemies(g.enemies, p, dt, g.time,
    (x, y, a, s, d, r) => g.bullets.fireEnemy(x, y, a, s, d, r),
    (x, y) => { g.enemies.push(spawnEnemy('drifter', x + 60, y, g.wave)); g.enemies.push(spawnEnemy('mini', x - 60, y, g.wave)); });

  g.bullets.update(dt, p, (value) => {
    audio.pickup();
    if (gainXp(p, value)) {
      audio.levelup();
      g.choices = rollUpgrades(g.takenUpgrades, g.rng);
      g.state = 'upgrade';
    }
  });

  // Player bullets vs enemies.
  for (let i = g.bullets.playerBullets.length - 1; i >= 0; i--) {
    const b = g.bullets.playerBullets[i];
    let consumed = false;
    for (const e of g.enemies.slice()) {
      if (dist2(b.x, b.y, e.x, e.y) < (e.radius + 6) ** 2) {
        const crit = Math.random() < p.critChance;
        const dmg = Math.round(b.damage * (crit ? 2 : 1));
        e.hp -= dmg;
        e.flash = 0.09;
        g.particles.burst(b.x, b.y, e.color, 4, 140, 0.3, 3);
        g.particles.floatText(e.x, e.y - e.radius - 4, crit ? 'CRIT ' + dmg : String(dmg), crit ? '#ffd94d' : '#e8fbff', crit);
        audio.hit();
        if (e.hp <= 0) killEnemy(e);
        if (b.pierce > 0) { b.pierce--; } else { consumed = true; }
        break;
      }
    }
    if (consumed) g.bullets.playerBullets.splice(i, 1);
  }

  // Enemy bullets vs player.
  for (let i = g.bullets.enemyBullets.length - 1; i >= 0; i--) {
    const b = g.bullets.enemyBullets[i];
    if (dist2(b.x, b.y, p.x, p.y) < (b.radius + p.radius - 4) ** 2) {
      g.bullets.enemyBullets.splice(i, 1);
      if (damagePlayer(p, b.damage)) {
        audio.hurt();
        g.shake = Math.max(g.shake, 8);
        g.combo = 0;
      }
    }
  }

  // Contact damage.
  for (const e of enemiesTouchingPlayer(g.enemies, p)) {
    if (damagePlayer(p, e.contact)) {
      audio.hurt();
      g.shake = Math.max(g.shake, 10);
      g.combo = 0;
      // Knock the enemy back so it cannot drain HP in one frame.
      const a = angleTo(p.x, p.y, e.x, e.y);
      e.x += Math.cos(a) * 30;
      e.y += Math.sin(a) * 30;
    }
  }

  // Combo decay.
  if (g.comboTimer > 0) {
    g.comboTimer -= dt;
    if (g.comboTimer <= 0) g.combo = 0;
  }

  if (!p.alive) {
    g.particles.burst(p.x, p.y, CFG.COLORS.player, 60, 380, 1.1, 5);
    g.particles.ring(p.x, p.y, '#22e6ff', 260);
    audio.explosion();
    saveBest();
    g.state = 'gameover';
    return;
  }

  // Wave cleared?
  if (g.spawnQueue.length === 0 && g.enemies.length === 0) startBreather();
}

function updateBreather(dt) {
  g.breatherTimer -= dt;
  const p = g.player;
  // Gentle drift during the breather; shards still fly in.
  p.x = clamp(p.x + input.moveVector().x * p.speed * dt, CFG.ARENA_MARGIN, CFG.W - CFG.ARENA_MARGIN);
  p.y = clamp(p.y + input.moveVector().y * p.speed * dt, CFG.ARENA_MARGIN, CFG.H - CFG.ARENA_MARGIN);
  g.bullets.update(dt, p, (v) => { if (gainXp(p, v)) { audio.levelup(); g.choices = rollUpgrades(g.takenUpgrades, g.rng); g.state = 'upgrade'; } });
  if (g.breatherTimer <= 0) {
    nextWave();
    g.state = 'playing';
  }
}

function update(dt) {
  g.time += dt;
  if (g.bannerAlpha > 0) g.bannerAlpha -= dt * 0.45;
  g.shake = Math.max(0, g.shake - dt * 26);
  g.shakeX = (Math.random() - 0.5) * g.shake;
  g.shakeY = (Math.random() - 0.5) * g.shake;
  g.particles.update(dt);
  audio.updateMusic();

  if (input.wasPressed('m')) audio.toggleMute();
  if (input.wasPressed('p') || input.wasPressed('escape')) {
    if (g.state === 'playing' || g.state === 'breather') g.state = 'paused';
    else if (g.state === 'paused') g.state = g.spawnQueue.length === 0 && g.enemies.length === 0 ? 'breather' : 'playing';
  }

  switch (g.state) {
    case 'title': {
      if (input.wasPressed('enter') || input.wasPressed(' ')) { audio.ensure(); audio.click(); startGame(); }
      else if (input.clicked && g.buttons.start && inside(input.clicked, g.buttons.start)) { audio.ensure(); audio.click(); startGame(); }
      break;
    }
    case 'playing': updatePlaying(dt); break;
    case 'breather': updateBreather(dt); break;
    case 'upgrade': {
      const pick = (i) => {
        if (i < g.choices.length) {
          applyUpgrade(g.player, g.choices[i], g.takenUpgrades);
          audio.click();
          g.state = 'playing';
        }
      };
      if (input.wasPressed('1')) pick(0);
      else if (input.wasPressed('2')) pick(1);
      else if (input.wasPressed('3')) pick(2);
      else if (input.clicked) {
        for (const r of g.cardRects) if (inside(input.clicked, r)) pick(r.index);
      }
      break;
    }
    case 'paused': {
      if (input.clicked && g.buttons.resume && inside(input.clicked, g.buttons.resume)) g.state = 'playing';
      break;
    }
    case 'gameover': {
      if (input.wasPressed('enter')) startGame();
      else if (input.clicked && g.buttons.restart && inside(input.clicked, g.buttons.restart)) startGame();
      break;
    }
    case 'victory': {
      if (input.clicked && g.buttons.endless && inside(input.clicked, g.buttons.endless)) {
        g.endless = true;
        g.state = 'playing';
        nextWave();
      } else if (input.clicked && g.buttons.restart && inside(input.clicked, g.buttons.restart)) startGame();
      else if (input.wasPressed('enter')) startGame();
      break;
    }
  }
  input.endFrame();
}

function inside(pt, r) {
  return pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;
}

function draw() {
  ctx.clearRect(0, 0, CFG.W, CFG.H);
  const st = g.state;
  if (st === 'title') {
    drawArena(ctx, g.time, 0, 0);
    drawEnemies(ctx, g.enemies, g.time);
    // No player ship here: it sits at arena centre (640, 400), exactly on the
    // controls text block, so the title stays clean.
    g.buttons = drawTitle(ctx, g.time, g.best);
    return;
  }
  drawArena(ctx, g.time, g.shakeX, g.shakeY);
  ctx.save();
  ctx.translate(g.shakeX, g.shakeY);
  g.bullets.draw(ctx);
  drawEnemies(ctx, g.enemies, g.time);
  if (g.player.alive && st !== 'gameover') drawPlayer(ctx, g.player, g.time);
  g.particles.draw(ctx);
  ctx.restore();
  drawHud(ctx, g);
  drawWaveBanner(ctx, g.bannerText, g.bannerAlpha);
  if (st === 'upgrade') g.cardRects = drawUpgradeOverlay(ctx, g.choices, g.player.level);
  else if (st === 'paused') g.buttons = drawPaused(ctx);
  else if (st === 'gameover') g.buttons = drawGameOver(ctx, g.score, g.wave, g.best, g.isNewBest);
  else if (st === 'victory') g.buttons = drawVictory(ctx, g.score, g.best);
}

// ---- boot ----
const shotParams = getShotParams();
if (shotParams.shot) {
  const staged = stageShot(g, shotParams.shot, shotParams.seed);
  if (staged) {
    // One deterministic frame; expose a hook so a test can read state.
    staged.draw(ctx);
    window.__voidfall = g;
  } else {
    document.getElementById('fallback').textContent = 'Unknown shot: ' + shotParams.shot;
  }
} else {
  window.__voidfall = g;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
