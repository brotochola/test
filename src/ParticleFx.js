import { Particle, ParticleContainer, Texture } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

export class ParticleFx {
  constructor(game) {
    this.game = game;
    this.texture = Texture.from(assetUrl("bubble.png"));
    this.pool = [];
    this.data = [];
    this.free = [];
    this.container = new ParticleContainer({
      texture: this.texture,
      dynamicProperties: {
        position: true,
        scale: true,
        rotation: true,
        color: true,
      },
    });
    this.container.zIndex = config.zIndex.fx;
    game.mainContainer.addChild(this.container);
  }

  burst(wx, wy, opts = {}) {
    const fx = config.fx;
    const count = opts.count ?? fx.count;
    const speed = opts.speed ?? fx.speed;
    const life = opts.life ?? fx.life;
    const spread = opts.spread ?? fx.spread;
    const size = opts.size ?? fx.size;
    const alpha = pickAlpha(opts.alpha ?? fx.alpha);
    const screen = this.game.toScreen(wx, wy);
    const tw = this.texture.width || 1;
    for (let i = 0; i < count; i++) {
      const slot = this._alloc();
      if (slot < 0) return;
      const p = this.pool[slot];
      const d = this.data[slot];
      const scale = pickRange(size) / tw;
      const spd = pickRange(speed);
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * spread;
      p.x = screen.x;
      p.y = screen.y;
      p.scaleX = scale;
      p.scaleY = scale;
      p.alpha = alpha.start;
      p.rotation = Math.random() * Math.PI * 2;
      d.vx = Math.cos(angle) * spd;
      d.vy = Math.sin(angle) * spd;
      d.age = 0;
      d.life = pickRange(life);
      d.scale = scale;
      d.alphaStart = alpha.start;
      d.alphaEnd = alpha.end;
      d.live = true;
    }
  }

  update(dt) {
    const float = config.fx.float;
    const offX = config.particles.offscreenX;
    const offY = config.particles.offscreenY;
    for (let i = 0; i < this.data.length; i++) {
      const d = this.data[i];
      if (!d.live) continue;
      if (advanceFx(d, dt, float)) {
        d.live = false;
        this.free.push(i);
        const p = this.pool[i];
        p.x = offX;
        p.y = offY;
        p.alpha = 0;
        continue;
      }
      const p = this.pool[i];
      p.x += d.vx * dt;
      p.y += d.vy * dt;
      const t = d.age / d.life;
      p.alpha = d.alphaStart + (d.alphaEnd - d.alphaStart) * t;
      const s = d.scale * (1 - 0.35 * t);
      p.scaleX = s;
      p.scaleY = s;
    }
  }

  destroy() {
    this.container.destroy();
    this.pool.length = 0;
    this.data.length = 0;
    this.free.length = 0;
  }

  _alloc() {
    if (this.free.length) return this.free.pop();
    if (this.pool.length >= config.fx.maxCount) return -1;
    const p = new Particle({
      texture: this.texture,
      anchorX: 0.5,
      anchorY: 0.5,
    });
    this.container.addParticle(p);
    p.x = config.particles.offscreenX;
    p.y = config.particles.offscreenY;
    p.alpha = 0;
    this.pool.push(p);
    this.data.push({
      vx: 0,
      vy: 0,
      age: 0,
      life: 1,
      scale: 1,
      alphaStart: 1,
      alphaEnd: 0,
      live: false,
    });
    return this.pool.length - 1;
  }
}

export function pickRange(v) {
  if (typeof v === "number") return v;
  const a = v.min ?? 0;
  const b = v.max ?? a;
  return a + Math.random() * (b - a);
}

export function pickAlpha(v) {
  if (typeof v === "number") return { start: v, end: 0 };
  return { start: v.start ?? 1, end: v.end ?? 0 };
}

export function advanceFx(d, dt, float) {
  d.age += dt;
  d.vy -= float * dt;
  return d.age >= d.life;
}

function assertAdvance() {
  const d = { age: 0, life: 0.1, vy: 0 };
  if (advanceFx(d, 0.05, 80)) throw new Error("fx should live");
  if (!advanceFx(d, 0.06, 80)) throw new Error("fx should die");
  if (!(d.vy < 0)) throw new Error("fx should float up");
  if (pickRange(5) !== 5) throw new Error("fx range number");
  if (pickRange({ min: 3, max: 3 }) !== 3) throw new Error("fx range minmax");
  const a = pickAlpha({ start: 0.33, end: 0 });
  if (a.start !== 0.33 || a.end !== 0) throw new Error("fx alpha range");
}

assertAdvance();
