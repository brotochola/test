import { Rectangle, Sprite } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";
import { assetUrl } from "./assets.js";
import { clientToCanvas } from "./pointer.js";

export function colliderHalf(size, margin) {
  return size / 2 + margin;
}

export function spriteSize(width, height, ppm) {
  return { w: width * ppm, h: height * ppm };
}

export class Box extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const rotate = !!options.rotate;
    const type = rotate
      ? lf.b2_kinematicBody
      : (options.type ?? lf.b2_staticBody);
    const density =
      options.density ??
      (type === lf.b2_staticBody
        ? config.box.staticDensity
        : config.box.density);
    const margin = config.box.margin;
    const hx = colliderHalf(options.width, margin);
    const hy = colliderHalf(options.height, margin);

    const def = new lf.b2BodyDef();
    def.type = type;
    def.position.Set(options.x, options.y);
    def.angle = options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const shape = new lf.b2PolygonShape();
    shape.SetAsBoxXY(hx, hy);
    const fd = new lf.b2FixtureDef();
    fd.shape = shape;
    fd.density = density;
    fd.friction = options.friction ?? config.box.friction;
    fd.restitution = options.restitution ?? config.box.restitution;
    body.CreateFixtureFromDef(fd);

    const size = spriteSize(
      options.width,
      options.height,
      config.world.pixelsPerMeter,
    );

    super(game, body);
    this.container.zIndex = config.zIndex.box;
    this.px = options.x;
    this.py = options.y;
    this._pos = new lf.b2Vec2(options.x, options.y);
    this._rotate = rotate;
    this._drag = false;
    this._pointer = -1;

    this.view = Sprite.from(assetUrl(options.src));
    this.view.anchor.set(0.5);
    this.view.width = size.w;
    this.view.height = size.h;
    this.container.addChild(this.view);

    if (rotate) {
      const pad = 28;
      this.container.eventMode = "static";
      this.container.cursor = "pointer";
      this.container.hitArea = new Rectangle(
        -size.w / 2 - pad,
        -size.h / 2 - pad,
        size.w + pad * 2,
        size.h + pad * 2,
      );
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
    }

    this.update();
  }

  aimAt(sx, sy) {
    const ppm = config.world.pixelsPerMeter;
    const wx = (sx - config.world.originX) / ppm;
    const wy = (config.world.originY - sy) / ppm;
    const dx = wx - this.px;
    const dy = wy - this.py;
    if (dx * dx + dy * dy < 1e-8) return;
    this.body.SetTransform(this._pos, Math.atan2(dy, dx));
    this.update();
  }

  update() {
    super.update();
    if (this.pivot) this.pivot.rotation = this.body.GetAngle();
  }

  destroy() {
    this._drag = false;
    if (this._rotate) {
      this.container.off("pointerdown", this._onDown);
      window.removeEventListener("pointermove", this._onMove);
      window.removeEventListener("pointerup", this._onUp);
      window.removeEventListener("pointercancel", this._onUp);
    }
    this.container.destroy();
  }
}

function assertBoxMargin() {
  const size = 2.2;
  const margin = config.box.margin;
  const ppm = config.world.pixelsPerMeter;
  if (colliderHalf(size, margin) !== size / 2 + margin) {
    throw new Error("box collider");
  }
  if (!(colliderHalf(size, margin) > size / 2)) {
    throw new Error("box collider should exceed the sprite");
  }
  const sprite = spriteSize(size, size, ppm);
  if (sprite.w !== size * ppm || sprite.h !== size * ppm) {
    throw new Error("box sprite size");
  }
}

assertBoxMargin();
