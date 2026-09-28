import { Sprite } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";

// ponytail: hand-fit boxes to flask1.png and flask2.png. Refit config.flask.types if those files change.
export class Flask extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const s = options.scale ?? 1;
    const art = config.flask.types[options.type ?? 1];
    if (!art) throw new Error(`unknown flask type ${options.type}`);
    const width = config.flask.width * s;
    const mpp = width / art.w;

    const def = new lf.b2BodyDef();
    def.type = lf.b2_staticBody;
    def.position.Set(options.x, options.y);
    def.angle = options.rotation ?? options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const boxes = art.boxes;
    for (let i = 0; i < boxes.length; i++) {
      addBoxFixture(body, rectFixture(boxes[i], art, mpp));
    }
    const slopes = art.slopes ?? [];
    for (let i = 0; i < slopes.length; i++) {
      addBoxFixture(body, slopeFixture(slopes[i], art, mpp));
    }

    super(game, body);
    this.container.zIndex = config.zIndex.flask;

    const fill = rectFixture(art.fill, art, mpp);
    this.innerW = fill.hx * 2;
    this.innerH = fill.hy * 2;
    this.fillX = fill.cx;
    this.fillY = fill.cy;
    this.amount = options.amount ?? 0;

    const ppm = config.world.pixelsPerMeter;
    const sprite = Sprite.from(
      new URL(`./assets/${art.src}`, import.meta.url).href,
    );
    sprite.anchor.set(0.5);
    sprite.width = width * ppm;
    sprite.height = width * (art.h / art.w) * ppm;
    // sprite.blendMode = "multiply";
    if (options.color != null) sprite.tint = options.color;
    this.view = sprite;
    this.container.addChild(this.view);
  }
}

function rectFixture([x0, y0, x1, y1], art, mpp) {
  return {
    hx: ((x1 - x0) / 2) * mpp,
    hy: ((y1 - y0) / 2) * mpp,
    cx: ((x0 + x1) / 2 - art.w / 2) * mpp,
    cy: (art.h / 2 - (y0 + y1) / 2) * mpp,
    angle: 0,
  };
}

function slopeFixture({ x0, y0, x1, y1, thick }, art, mpp) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  return {
    hx: (thick / 2) * mpp,
    hy: (Math.hypot(dx, dy) / 2) * mpp,
    cx: ((x0 + x1) / 2 - art.w / 2) * mpp,
    cy: (art.h / 2 - (y0 + y1) / 2) * mpp,
    angle: Math.atan2(-dx, -dy),
  };
}

function addBoxFixture(body, { hx, hy, cx, cy, angle }) {
  const lf = window.liquidfun;
  const shape = new lf.b2PolygonShape();
  shape.SetAsBoxXYCenterAngle(hx, hy, new lf.b2Vec2(cx, cy), angle);
  const fd = new lf.b2FixtureDef();
  fd.shape = shape;
  fd.density = config.box.staticDensity;
  fd.friction = config.box.friction;
  fd.restitution = config.box.restitution;
  body.CreateFixtureFromDef(fd);
}

function assertFlaskTypes() {
  const types = config.flask.types;
  for (let type = 1; type <= 2; type++) {
    const art = types[type];
    if (!art) throw new Error(`flask type ${type}`);
    let hasBottom = false;
    for (let i = 0; i < art.boxes.length; i++) {
      const c = rectFixture(art.boxes[i], art, 1);
      if (Math.abs(c.cx) > art.w / 2 || Math.abs(c.cy) > art.h / 2) {
        throw new Error("flask fixture outside sprite");
      }
      if (c.cy < -0.3 * art.h && c.hx > c.hy) hasBottom = true;
    }
    const slopes = art.slopes ?? [];
    for (let i = 0; i < slopes.length; i++) {
      const c = slopeFixture(slopes[i], art, 1);
      if (Math.abs(c.cx) > art.w / 2 || Math.abs(c.cy) > art.h / 2) {
        throw new Error("flask slope outside sprite");
      }
    }
    if (!hasBottom) throw new Error(`flask type ${type} has no bottom`);
  }
}

assertFlaskTypes();
