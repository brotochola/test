import { Sprite } from './vendor/pixi.min.mjs';
import { config } from './config.js';
import { GameObject } from './GameObject.js';

const SPRITE_SRC = new URL('./assets/flask1.png', import.meta.url).href;
const SPRITE_ASPECT = 430 / 333;

export class Flask extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const s = options.scale ?? 1;
    const W = (options.innerWidth ?? config.flask.innerWidth) * s;
    const H = (options.innerHeight ?? config.flask.innerHeight) * s;
    const T = (options.thickness ?? config.flask.thickness) * s;

    const def = new lf.b2BodyDef();
    def.type = options.type ?? lf.b2_staticBody;
    def.position.Set(options.x, options.y);
    def.angle = options.rotation ?? options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const left = { hx: T / 2, hy: H / 2 + T / 2, cx: -W / 2 - T / 2, cy: -T / 2 };
    const right = { hx: T / 2, hy: H / 2 + T / 2, cx: W / 2 + T / 2, cy: -T / 2 };
    const bottom = { hx: W / 2 + T, hy: T / 2, cx: 0, cy: -H / 2 - T / 2 };
    addBoxFixture(body, left);
    addBoxFixture(body, right);
    addBoxFixture(body, bottom);

    super(game, body);

    this.innerW = W;
    this.innerH = H;
    this.amount = options.amount ?? 0;

    const ppm = config.world.pixelsPerMeter;
    const sprite = Sprite.from(SPRITE_SRC);
    sprite.anchor.set(0.5);
    sprite.width = (W + 2 * T) * ppm;
    sprite.height = sprite.width * SPRITE_ASPECT;
    sprite.y = (H / 2 + T) * ppm - sprite.height / 2;
    if (options.color != null) sprite.tint = options.color;
    this.view = sprite;
    this.container.addChild(this.view);
  }
}

function addBoxFixture(body, { hx, hy, cx, cy }) {
  const lf = window.liquidfun;
  const shape = new lf.b2PolygonShape();
  shape.SetAsBoxXYCenterAngle(hx, hy, new lf.b2Vec2(cx, cy), 0);
  const fd = new lf.b2FixtureDef();
  fd.shape = shape;
  fd.density = config.box.staticDensity;
  fd.friction = config.box.friction;
  fd.restitution = config.box.restitution;
  body.CreateFixtureFromDef(fd);
}
