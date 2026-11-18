// Particles, shockwave rings and floating damage numbers.
export function createParticles() {
  const parts = [];
  const rings = [];
  const texts = [];

  function burst(x, y, color, count, speed, life, size) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random() * 0.7);
      parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: life * (0.6 + Math.random() * 0.6), maxLife: life,
        size: size * (0.6 + Math.random() * 0.8), color,
      });
    }
  }

  function ring(x, y, color, maxR) {
    rings.push({ x, y, r: 8, maxR: maxR || 220, life: 0.45, maxLife: 0.45, color });
  }

  function floatText(x, y, text, color, big) {
    texts.push({ x, y, text, color, life: 0.9, maxLife: 0.9, big: !!big });
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.94; p.vy *= 0.94;
      p.life -= dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i];
      r.life -= dt;
      r.r = r.maxR * (1 - r.life / r.maxLife);
      if (r.life <= 0) rings.splice(i, 1);
    }
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      t.y -= 42 * dt;
      t.life -= dt;
      if (t.life <= 0) texts.splice(i, 1);
    }
  }

  function draw(ctx) {
    for (const p of parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    for (const r of rings) {
      ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.9;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    for (const t of texts) {
      ctx.globalAlpha = Math.max(0, t.life / t.maxLife);
      ctx.font = t.big ? 'bold 22px system-ui, sans-serif' : 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }

  return { burst, ring, floatText, update, draw, parts, rings, texts };
}
