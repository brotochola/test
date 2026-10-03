import { Container, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";
import { assetUrl } from "./assets.js";

const COIN = assetUrl("audio/coin.mp3");

// ponytail: hand-fit boxes to flask1_front.png. Refit config.flask.types if that file changes.
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
    this.need = options.amount || config.flask.minCount;
    this.targetColor = options.targetColor ?? config.flask.liquidColor;

    const ppm = config.world.pixelsPerMeter;
    const spriteW = width * ppm;
    const spriteH = width * (art.h / art.w) * ppm;

    this.view = flaskSprite(art.src, spriteW, spriteH, options.color);
    this.container.addChild(this.view);

    if (art.srcBack) {
      this.backContainer = new Container();
      this.backContainer.zIndex = config.zIndex.flaskBack;
      this.back = flaskSprite(art.srcBack, spriteW, spriteH, options.color);
      this.backContainer.addChild(this.back);
      game.mainContainer.addChild(this.backContainer);
      this.backContainer.position.copyFrom(this.container.position);
      this.backContainer.rotation = this.container.rotation;
    }

    const tint =
      (this.targetColor[0] << 16) |
      (this.targetColor[1] << 8) |
      this.targetColor[2];
    const labelW = config.flask.labelW * s;
    const label = Sprite.from(assetUrl("label.png"));
    label.anchor.set(0.5);
    label.width = labelW;
    label.height = labelW * (config.flask.labelSrcH / config.flask.labelSrcW);
    label.position.set(0, this.view.height * 0.125);
    label.tint = tint;
    this.label = label;
    this.container.addChild(this.label);

    this.countText = new Text({
      text: `0/${this.need}`,
      style: {
        fill: config.ui.ink,
        fontSize: 22 * s,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
      },
    });
    this.countText.anchor.set(0.5);
    this.countText.position.set(label.position.x, label.position.y);
    this.container.addChild(this.countText);
    this._lastN = 0;
  }

  get fillCount() {
    return Math.min(this._lastN, this.need);
  }

  resetCount() {
    this._lastN = 0;
    this.countText.text = `0/${this.need}`;
  }

  update() {
    super.update();
    if (!this.backContainer) return;
    this.backContainer.position.copyFrom(this.container.position);
    this.backContainer.rotation = this.container.rotation;
  }

  destroy() {
    if (this.backContainer) this.backContainer.destroy();
    this.container.destroy();
  }

  fillAabb() {
    const lf = window.liquidfun;
    if (!this._aabb) {
      this._aabb = new lf.b2AABB();
      this._pt = new lf.b2Vec2();
    }
    const hx = this.innerW / 2;
    const hy = this.innerH / 2;
    const ox = this.fillX;
    const oy = this.fillY;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const corners = [
      [ox - hx, oy - hy],
      [ox + hx, oy - hy],
      [ox - hx, oy + hy],
      [ox + hx, oy + hy],
    ];
    for (let i = 0; i < 4; i++) {
      this._pt.Set(corners[i][0], corners[i][1]);
      const w = this.body.GetWorldPoint(this._pt);
      if (w.x < minX) minX = w.x;
      if (w.y < minY) minY = w.y;
      if (w.x > maxX) maxX = w.x;
      if (w.y > maxY) maxY = w.y;
    }
    this._aabb.lowerBound.Set(minX, minY);
    this._aabb.upperBound.Set(maxX, maxY);
    return this._aabb;
  }

  sample(liquid) {
    const aabb = this.fillAabb();
    const { n, rgb } = liquid.avgColorInAabb(aabb);
    const coins = Math.min(n, this.need);
    this.countText.text = `${coins}/${this.need}`;
    const delta = n - this._lastN;

    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        if (!this.game.fx) continue;
        const count = Math.random() < 0.5 ? 2 : 4;
        const x =
          aabb.lowerBound.x +
          Math.random() * (aabb.upperBound.x - aabb.lowerBound.x);
        const y =
          aabb.lowerBound.y +
          Math.random() * (aabb.upperBound.y - aabb.lowerBound.y);
        if (Math.random() > 0.9)
          this.game.fx.burst(x, y, { ...config.fx.flask, count });
      }
    }
    if (coins > Math.min(this._lastN, this.need)) {
      this.game.sound.play(COIN, { ascendingPitch: true, volume: 0.4 });
      this.game.hud?.flyCoin(this.container.x, this.container.y);
    }
    this._lastN = n;
    if (n < this.need) return false;
    const colorDistTemp = colorDist(rgb, this.targetColor);
    // console.log(liquid, rgb, this.targetColor, colorDistTemp);
    return colorDistTemp <= config.flask.colorTolerance;
  }
}

function flaskSprite(src, w, h, tint) {
  const sprite = Sprite.from(assetUrl(src));
  sprite.anchor.set(0.5);
  sprite.width = w;
  sprite.height = h;
  if (tint != null) sprite.tint = tint;
  return sprite;
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

export function colorDist(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}
