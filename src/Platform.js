import { Rectangle, Sprite } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";
import { assetUrl } from "./assets.js";
import { clientToCanvas } from "./pointer.js";

export function colliderHalf(size, margin) {
  return size / 2 + margin;
}

export class Platform extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const art = config.platform.kinds[options.type];
    if (!art) throw new Error(`unknown platform type ${options.type}`);
    const ppm = config.world.pixelsPerMeter;
    const width = art.w / ppm;
    const height = art.h / ppm;
    const rotate = !!options.rotate;
    const bodyType = rotate ? lf.b2_kinematicBody : lf.b2_staticBody;
    const margin = config.box.margin;
    const hx = colliderHalf(width, margin);
    const hy = colliderHalf(height, margin);

    const def = new lf.b2BodyDef();
    def.type = bodyType;
    def.position.Set(options.x, options.y);
    def.angle = options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const shape = new lf.b2PolygonShape();
    shape.SetAsBoxXY(hx, hy);
    const fd = new lf.b2FixtureDef();
    fd.shape = shape;
    fd.density = config.box.staticDensity;
    fd.friction = options.friction ?? config.box.friction;
    fd.restitution = options.restitution ?? config.box.restitution;
    body.CreateFixtureFromDef(fd);

    super(game, body);
    this.container.zIndex = config.zIndex.platform;
    this.px = options.x;
    this.py = options.y;
    this._pos = new lf.b2Vec2(options.x, options.y);
    this._rotate = rotate;
    this._drag = false;
    this._pointer = -1;

    this.view = Sprite.from(assetUrl(art.src));
    this.view.anchor.set(0.5);
    this.view.width = art.w;
    this.view.height = art.h;
    if (!rotate) this.view.tint = 0x9aa3ad;
    this.container.addChild(this.view);

    if (rotate) {
      const pad = 28;
      this.container.eventMode = "static";
      this.container.cursor = "pointer";
      this.container.hitArea = new Rectangle(
        -art.w / 2 - pad,
        -art.h / 2 - pad,
        art.w + pad * 2,
        art.h + pad * 2,
      );
      this._onDown = (e) => {
        if (!this.game.canAim("platform")) return;
        this._drag = true;
        this._pointer = e.pointerId;
        this.container.scale.set(1.04);
        this.aimAt(e.global.x, e.global.y);
        this.game.onAimed("platform");
      };
      this._onMove = (e) => {
        if (!this._drag || e.pointerId !== this._pointer) return;
        const p = clientToCanvas(game.app.canvas, e.clientX, e.clientY);
        this.aimAt(p.x, p.y, true);
      };
      this._onUp = (e) => {
        if (e.pointerId !== this._pointer) return;
        this._drag = false;
        this.container.scale.set(1);
      };
      this.container.on("pointerdown", this._onDown);
      window.addEventListener("pointermove", this._onMove);
      window.addEventListener("pointerup", this._onUp);
      window.addEventListener("pointercancel", this._onUp);
    }

    this.update();
  }

  aimAt(sx, sy, dragging = false) {
    if (!dragging && !this.game.canAim("platform")) return;
    const ppm = config.world.pixelsPerMeter;
    const wx = (sx - config.world.originX) / ppm;
    const wy = (config.world.originY - sy) / ppm;
    const dx = wx - this.px;
    const dy = wy - this.py;
    if (dx * dx + dy * dy < 1e-8) return;
    this.setAngle(Math.atan2(dy, dx));
  }

  setAngle(angle) {
    this.body.SetTransform(this._pos, angle);
    this.update();
  }

  destroy() {
    this._drag = false;
    this.container.scale.set(1);
    if (this._rotate) {
      this.container.off("pointerdown", this._onDown);
      window.removeEventListener("pointermove", this._onMove);
      window.removeEventListener("pointerup", this._onUp);
      window.removeEventListener("pointercancel", this._onUp);
    }
    this.container.destroy();
  }
}
