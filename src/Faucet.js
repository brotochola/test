import { Container, Graphics, Rectangle } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";

export class Faucet {
  constructor(game, options) {
    const hx = options.hx ?? config.faucet.hx;
    const hy = options.hy ?? config.faucet.hy;
    const vx = options.vx ?? 0;
    const vy = options.vy ?? 0;
    const given = Math.hypot(vx, vy);

    this.game = game;
    this.x = options.x;
    this.y = options.y;
    this.color = options.color;
    this.rate = options.rate ?? config.faucet.rate;
    this.amount = options.amount ?? 0;
    this.emitted = 0;
    this.acc = 0;
    this.speed = given > 0 ? given : config.faucet.speed;
    this.aim = given > 0 ? Math.atan2(vy, vx) : -Math.PI / 2;
    this.vx = Math.cos(this.aim) * this.speed;
    this.vy = Math.sin(this.aim) * this.speed;
    this._nozzleDist = hy + config.particles.radius;
    this._drag = false;
    this._pointer = -1;

    const ppm = config.world.pixelsPerMeter;
    const w = hx * ppm * 2;
    const h = hy * ppm * 2;
    const pad = 28;

    this.container = new Container();
    this.container.zIndex = config.zIndex.faucet;
    this.container.eventMode = "static";
    this.container.cursor = "pointer";
    this.container.hitArea = new Rectangle(
      -w / 2 - pad,
      -h / 2 - pad,
      w + pad * 2,
      h + pad * 2,
    );
    this.view = new Graphics().rect(-w / 2, -h / 2, w, h).fill(options.fill);
    this.container.addChild(this.view);
    game.mainContainer.addChild(this.container);
    game.objects.push(this);

    this._onDown = (e) => {
      this._drag = true;
      this._pointer = e.pointerId;
      this.aimAt(e.global.x, e.global.y);
    };
    this._onMove = (e) => {
      if (!this._drag || e.pointerId !== this._pointer) return;
      const p = clientToCanvas(game.app.canvas, e.clientX, e.clientY);
      this.aimAt(p.x, p.y);
    };
    this._onUp = (e) => {
      if (e.pointerId !== this._pointer) return;
      this._drag = false;
    };
    this.container.on("pointerdown", this._onDown);
    window.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerup", this._onUp);
    window.addEventListener("pointercancel", this._onUp);
    this.update();
  }

  aimAt(sx, sy) {
    const ppm = config.world.pixelsPerMeter;
    const wx = (sx - config.world.originX) / ppm;
    const wy = (config.world.originY - sy) / ppm;
    const dx = wx - this.x;
    const dy = wy - this.y;
    if (dx * dx + dy * dy < 1e-8) return;
    this.aim = Math.atan2(dy, dx);
    this.vx = Math.cos(this.aim) * this.speed;
    this.vy = Math.sin(this.aim) * this.speed;
    this.update();
  }

  update() {
    const s = this.game.toScreen(this.x, this.y);
    this.container.position.set(s.x, s.y);
    this.container.rotation = aimRotation(this.aim);
  }

  step(dt) {
    if (this.emitted >= this.amount) return;
    this.acc += dt;
    const interval = 1 / this.rate;
    if (!(interval > 0) || interval === Infinity) return;
    while (this.acc >= interval && this.emitted < this.amount) {
      this.acc -= interval;
      const ox = this.x + Math.cos(this.aim) * this._nozzleDist;
      const oy = this.y + Math.sin(this.aim) * this._nozzleDist;
      this.game.liquid.emit(ox, oy, this.vx, this.vy, this.color);
      this.emitted++;
    }
  }

  destroy() {
    this._drag = false;
    this.container.off("pointerdown", this._onDown);
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("pointercancel", this._onUp);
    this.container.destroy();
  }
}

export function aimRotation(aim) {
  return -Math.PI / 2 - aim;
}

function clientToCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height,
  };
}

function assertAim() {
  const down = aimRotation(-Math.PI / 2);
  if (Math.abs(down) > 1e-6) throw new Error("faucet down rotation");
  if (Math.abs(aimRotation(0) + Math.PI / 2) > 1e-6) {
    throw new Error("faucet right rotation");
  }
  const vx = Math.cos(-Math.PI / 2) * 10;
  const vy = Math.sin(-Math.PI / 2) * 10;
  if (Math.abs(vx) > 1e-6 || Math.abs(vy + 10) > 1e-6) {
    throw new Error("faucet down velocity");
  }
}

assertAim();
