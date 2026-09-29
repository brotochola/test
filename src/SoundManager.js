const ASCEND_MIN = -5;
const ASCEND_MAX = 6;

export function semitoneRate(n) {
  return 2 ** (n / 12);
}

export function nextAscending(last) {
  if (last == null) return 0;
  const n = last + 1;
  return n > ASCEND_MAX ? ASCEND_MIN : n;
}

function pitchSemitones(pitch) {
  if (typeof pitch === "number") return pitch;
  const min = pitch.min ?? 0;
  const max = pitch.max ?? min;
  return min + Math.random() * (max - min);
}

function rateFor(url, opts, steps) {
  if (opts.ascendingPitch) {
    const n = nextAscending(steps.get(url));
    steps.set(url, n);
    return semitoneRate(n);
  }
  if (opts.pitch == null) return 1;
  return semitoneRate(pitchSemitones(opts.pitch));
}

export class SoundManager {
  constructor() {
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.buffers = new Map();
    this.steps = new Map();
    this.loops = new Map();
    this._id = 1;
    this.unlocked = false;
    this.muted = false;
  }

  async load(url) {
    if (this.buffers.has(url)) return this.buffers.get(url);
    const res = await fetch(url);
    const raw = await res.arrayBuffer();
    const audio = await this.ctx.decodeAudioData(raw);
    this.buffers.set(url, audio);
    return audio;
  }

  unlock() {
    this.unlocked = true;
    return this.resume();
  }

  resume() {
    if (!this.unlocked) return;
    if (this.ctx.state === "suspended") return this.ctx.resume();
  }

  suspend() {
    if (this.ctx.state === "running") return this.ctx.suspend();
  }

  setMuted(on) {
    this.muted = on;
    this.master.gain.value = on ? 0 : 1;
  }

  play(url, opts = {}) {
    const buffer = this.buffers.get(url);
    if (!buffer) return;
    const ctx = this.ctx;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = !!opts.loop;
    source.playbackRate.value = rateFor(url, opts, this.steps);
    const gain = ctx.createGain();
    gain.gain.value = opts.volume ?? 1;
    source.connect(gain);
    gain.connect(this.master);
    source.start();
    if (!opts.loop) {
      source.onended = () => {
        source.disconnect();
        gain.disconnect();
      };
      return;
    }
    const id = this._id++;
    this.loops.set(id, { source, gain });
    source.onended = () => {
      this.loops.delete(id);
      source.disconnect();
      gain.disconnect();
    };
    return id;
  }

  stopLooping(id) {
    const loop = this.loops.get(id);
    if (!loop) return;
    this.loops.delete(id);
    loop.source.onended = null;
    try {
      loop.source.stop();
    } catch {
      /* already stopped */
    }
    loop.source.disconnect();
    loop.gain.disconnect();
  }
}
