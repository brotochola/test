import { Container, Particle, ParticleContainer, Rectangle, Texture } from '../pixi.min.mjs';
import { config } from '../config.js';
import { createMetaballFilter } from './metaballFilter.js';

export class LiquidParticles {
  constructor(game) {
    this.game = game;
    this.pool = [];
    this.texture = makeGradientTexture(config.particles.textureSize);
    this.system = createParticleSystem(game.world);

    this.root = new Container();
    this.root.filters = [createMetaballFilter()];
    this.root.filterArea = new Rectangle(0, 0, config.app.width, config.app.height);

    this.container = new ParticleContainer({
      texture: this.texture,
      dynamicProperties: { position: true },
    });
    this.container.blendMode = config.particles.blendMode;
    this.root.addChild(this.container);
    game.mainContainer.addChild(this.root);
  }

  spawnBox({ x, y, hx, hy }) {
    const lf = window.liquidfun;
    const shape = new lf.b2PolygonShape();
    shape.SetAsBoxXY(hx, hy);

    const pgd = new lf.b2ParticleGroupDef();
    pgd.shape = shape;
    pgd.flags = particleFlags(lf);
    pgd.position.Set(x, y);
    this.system.CreateParticleGroup(pgd);

    const buffer = this.system.GetPositionBuffer();
    console.assert(buffer.length > 0, 'LiquidFun position buffer is empty after spawn');
    this.ensurePool(buffer.length / 2);
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

  sync() {
    const buffer = this.system.GetPositionBuffer();
    const count = buffer.length / 2;
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
        p.x = ox + buffer[i2] * ppm;
        p.y = oy - buffer[i2 + 1] * ppm;
      } else {
        p.x = offX;
        p.y = offY;
      }
    }
    this.container.update();
  }
}

function createParticleSystem(world) {
  const lf = window.liquidfun;
  const def = new lf.b2ParticleSystemDef();
  def.radius = config.particles.radius;
  def.dampingStrength = config.particles.damping;
  const system = world.CreateParticleSystem(def);
  system.SetDensity(config.particles.density);
  system.SetDamping(config.particles.damping);
  return system;
}

function particleFlags(lf) {
  let flags = lf.b2_waterParticle;
  if (config.particles.viscous) flags |= lf.b2_viscousParticle;
  if (config.particles.tensile) flags |= lf.b2_tensileParticle;
  return flags;
}

function makeGradientTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const half = size * config.particles.anchor;
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
  gradient.addColorStop(0, config.particles.gradientInner);
  gradient.addColorStop(1, config.particles.gradientOuter);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}
