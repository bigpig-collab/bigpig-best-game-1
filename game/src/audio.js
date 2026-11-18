// Synthesized WebAudio sound effects and a small bass + arpeggio music loop.
// No audio files: every sound is built from oscillators at runtime.
export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    musicGain: null,
    muted: false,
    musicOn: false,
    nextNoteTime: 0,
    step: 0,
  };

  audio.ensure = function () {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio.ctx = new AC();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = 0.5;
      audio.master.connect(audio.ctx.destination);
      audio.musicGain = audio.ctx.createGain();
      audio.musicGain.gain.value = 0.16;
      audio.musicGain.connect(audio.master);
      audio.nextNoteTime = audio.ctx.currentTime + 0.1;
    } catch (err) { /* audio unavailable: game stays silent */ }
  };

  audio.toggleMute = function () {
    audio.muted = !audio.muted;
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
    return audio.muted;
  };

  function tone(freq, dur, type, vol, slideTo, when) {
    if (!audio.ctx || audio.muted) return;
    const t0 = when ?? audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const g = audio.ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    g.gain.setValueAtTime(vol || 0.2, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g);
    g.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, freq) {
    if (!audio.ctx || audio.muted) return;
    const len = Math.floor(audio.ctx.sampleRate * dur);
    const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.ctx.createBufferSource();
    src.buffer = buf;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq || 1200;
    const g = audio.ctx.createGain();
    g.gain.value = vol || 0.3;
    src.connect(filter); filter.connect(g); g.connect(audio.master);
    src.start();
  }

  audio.shoot = () => tone(880, 0.07, 'square', 0.08, 320);
  audio.hit = () => tone(220, 0.06, 'sawtooth', 0.1, 140);
  audio.explosion = () => { noise(0.35, 0.4, 900); tone(120, 0.3, 'sine', 0.3, 40); };
  audio.pickup = () => tone(1320, 0.08, 'sine', 0.12, 1760);
  audio.levelup = () => { tone(523, 0.12, 'triangle', 0.2); tone(659, 0.12, 'triangle', 0.2, null, audio.ctx ? audio.ctx.currentTime + 0.09 : 0); tone(784, 0.2, 'triangle', 0.22, null, audio.ctx ? audio.ctx.currentTime + 0.18 : 0); };
  audio.hurt = () => { tone(160, 0.18, 'sawtooth', 0.25, 60); noise(0.12, 0.2, 500); };
  audio.nova = () => { noise(0.5, 0.35, 2400); tone(440, 0.45, 'sine', 0.25, 60); };
  audio.dash = () => noise(0.14, 0.14, 3000);
  audio.boss = () => { tone(98, 0.6, 'sawtooth', 0.25, 49); tone(147, 0.6, 'sawtooth', 0.15, 73); };
  audio.click = () => tone(660, 0.05, 'sine', 0.12);

  // 8-step loop: Am — F — C — G roots with a bright arp on top.
  const BASS = [110, 87.31, 130.81, 98];
  const ARP = [220, 261.63, 329.63, 440, 329.63, 261.63];
  audio.updateMusic = function () {
    if (!audio.ctx || audio.muted || !audio.musicOn) return;
    const stepDur = 0.22;
    while (audio.nextNoteTime < audio.ctx.currentTime + 0.25) {
      const bar = Math.floor(audio.step / 8) % 4;
      const s = audio.step % 8;
      const t = audio.nextNoteTime;
      if (s === 0) tone(BASS[bar], 0.5, 'triangle', 0.5, null, t);
      tone(ARP[(audio.step * 2 + bar) % ARP.length] * 2, 0.16, 'square', 0.05, null, t);
      if (s === 4) tone(BASS[bar] * 1.5, 0.2, 'triangle', 0.25, null, t);
      audio.nextNoteTime += stepDur;
      audio.step++;
    }
  };

  audio.startMusic = function () { audio.ensure(); audio.musicOn = true; };
  return audio;
}
