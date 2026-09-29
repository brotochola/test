import {
  Container,
  Particle,
  ParticleContainer,
  Rectangle,
  Texture,
} from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { createMetaballFilter } from "./metaballFilter.js";
import { SpatialHash } from "./SpatialHash.js";

export class LiquidParticles {
  constructor(game) {
    this.game = game;
    this.pool = [];
    this._count = 0;
    this.texture = makeGradientTexture(config.particles.textureSize);
    this.system = createParticleSystem(game.world);
    this._circle = null;
    this._pgd = null;
    this.grid = new SpatialHash(config.particles.gridCell);

    this.root = new Container();
    this.root.filters = [createMetaballFilter()];
    this.root.filterArea = new Rectangle(
      0,
      0,
      config.app.width,
      config.app.height,
    );

    this.container = new ParticleContainer({
      texture: this.texture,
      dynamicProperties: { position: true, color: true },
    });
    this.container.blendMode = config.particles.blendMode;
    this.root.addChild(this.container);
    this.root.zIndex = config.zIndex.liquid;
    game.mainContainer.addChild(this.root);
  }

  particleCount() {
    return this._count;
  }

  fillFlask(body, innerW, innerH, count, color, ox = 0, oy = 0) {
    const room = config.particles.maxCount - this._count;
    if (room <= 0 || count <= 0) return;
    const gap = config.particles.radius * 2;
    const pts = fillPoints(innerW, innerH, Math.min(count, room), gap);
    const local = new window.liquidfun.b2Vec2(0, 0);
    for (let i = 0; i < pts.length; i++) {
      local.Set(pts[i].x + ox, pts[i].y + oy);
      const world = body.GetWorldPoint(local);
      this.emit(world.x, world.y, 0, 0, color);
    }
  }

  emit(x, y, vx, vy, color) {
    if (this._count >= config.particles.maxCount) return;
    const lf = window.liquidfun;
    // ponytail: this port's CreateParticle does def.group = (b2ParticleGroup*)&group
    // (stack double as a group) → RotateBuffer on garbage indices, tab freeze.
    // Circle CreateParticleGroup sets group = NULL. stride = 2*radius → 1 particle.
    if (!this._pgd) {
      this._circle = new lf.b2CircleShape();
      this._circle.radius = config.particles.radius;
      this._pgd = new lf.b2ParticleGroupDef();
      this._pgd.shape = this._circle;
      this._pgd.stride = config.particles.radius * 2;
    }
    const pgd = this._pgd;
    pgd.flags = particleFlags(lf);
    pgd.color.Set(color[0], color[1], color[2], color[3]);
    pgd.position.Set(x, y);
    pgd.linearVelocity.Set(vx, vy);
    this.system.CreateParticleGroup(pgd);
    this._count = this.system.GetPositionBuffer().length / 2;
  }

  ensurePool(count) {
    // ponytail: cap at maxCount; raise config.particles.maxCount if the group is bigger
    const need = Math.min(count, config.particles.maxCount);
    const { scale, anchor } = config.particles;
    while (this.pool.length < need) {
      const p = new Particle({
        texture: this.texture,
        anchorX: anchor,
        anchorY: anchor,
        scaleX: scale,
        scaleY: scale,
      });
      this.container.addParticle(p);
      this.pool.push(p);
    }
  }

  cullBelow() {
    if (!this._kill) this._kill = makeKill(window.liquidfun);
    this.system.DestroyParticlesInShape(this._kill.shape, this._kill.xf);
  }

  sync() {
    const buffer = this.system.GetPositionBuffer(); //i'd be better to get the buffer directly
    const colors = this.system.GetColorBuffer();
    const count = buffer.length / 2;
    this._count = count;
    this.ensurePool(count);
    const n = Math.min(count, this.pool.length);
    const ppm = config.world.pixelsPerMeter;
    const ox = config.world.originX;
    const oy = config.world.originY;
    const offX = config.particles.offscreenX;
    const offY = config.particles.offscreenY;
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (i < n) {
        const i2 = i * 2;
        const i4 = i * 4;
        p.x = ox + buffer[i2] * ppm;
        p.y = oy - buffer[i2 + 1] * ppm;
        p.tint = (colors[i4] << 16) | (colors[i4 + 1] << 8) | colors[i4 + 2];
        p.alpha = colors[i4 + 3] / 255;
      } else {
        p.x = offX;
        p.y = offY;
      }
    }
    this.grid.rebuild(buffer, n);
  }

  avgColorInAabb(aabb) {
    const pos = this.system.GetPositionBuffer();
    const colors = this.system.GetColorBuffer();
    let n = 0;
    let r = 0;
    let g = 0;
    let b = 0;
    this.grid.queryAABB(aabb, pos, (i) => {
      const i4 = i * 4;
      r += colors[i4];
      g += colors[i4 + 1];
      b += colors[i4 + 2];
      n++;
    });
    if (n === 0) return { n: 0, rgb: [0, 0, 0] };
    return { n, rgb: [r / n, g / n, b / n] };
  }
}

export function fillPoints(innerW, innerH, count, gap) {
  const pts = [];
  if (count <= 0 || gap <= 0 || innerW <= 0 || innerH <= 0) return pts;
  const cols = Math.floor(innerW / gap);
  const rows = Math.floor(innerH / gap);
  if (cols < 1 || rows < 1) return pts;
  const n = Math.min(count, cols * rows);
  const x0 = -((cols - 1) * gap) / 2;
  const y0 = -innerH / 2 + gap / 2;
  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = (i / cols) | 0;
    pts.push({ x: x0 + col * gap, y: y0 + row * gap });
  }
  return pts;
}

// ponytail: fixed slab; a particle faster than killDepth/timeStep in one step falls through it
const killDepth = 32;

export function killBox(worldW, margin, depth) {
  const hy = depth / 2;
  return { x: worldW / 2, y: -margin - hy, hx: worldW, hy };
}

function makeKill(lf) {
  const w = config.app.width / config.world.pixelsPerMeter;
  const box = killBox(w, config.particles.killMargin, killDepth);
  const shape = new lf.b2PolygonShape();
  shape.SetAsBoxXYCenterAngle(box.hx, box.hy, new lf.b2Vec2(box.x, box.y), 0);
  const xf = new lf.b2Transform();
  xf.SetIdentity();
  return { shape, xf };
}

function createParticleSystem(world) {
  const lf = window.liquidfun;
  const def = new lf.b2ParticleSystemDef();
  def.radius = config.particles.radius;
  def.dampingStrength = config.particles.damping;
  def.colorMixingStrength = config.particles.colorMixingStrength;
  const system = world.CreateParticleSystem(def);
  system.SetDensity(config.particles.density);
  system.SetDamping(config.particles.damping);
  return system;
}

function particleFlags(lf) {
  let flags = lf.b2_waterParticle;
  if (config.particles.viscous) flags |= lf.b2_viscousParticle;
  if (config.particles.tensile) flags |= lf.b2_tensileParticle;
  if (config.particles.colorMixing) flags |= lf.b2_colorMixingParticle;
  return flags;
}

function makeGradientTexture(size) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const half = size * config.particles.anchor;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, config.particles.gradientInner);
  gradient.addColorStop(1, config.particles.gradientOuter);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}
