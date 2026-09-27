import { Graphics } from './vendor/pixi.min.mjs';
import { config } from './config.js';
import { GameObject } from './GameObject.js';

export class Flask extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const W = options.innerWidth ?? config.flask.innerWidth;
    const H = options.innerHeight ?? config.flask.innerHeight;
    const T = options.thickness ?? config.flask.thickness;
    const color = options.color ?? config.flask.color;

    const def = new lf.b2BodyDef();
    def.type = options.type ?? lf.b2_staticBody;
    def.position.Set(options.x, options.y);
    def.angle = options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const left = { hx: T / 2, hy: H / 2 + T / 2, cx: -W / 2 - T / 2, cy: -T / 2 };
    const right = { hx: T / 2, hy: H / 2 + T / 2, cx: W / 2 + T / 2, cy: -T / 2 };
    const bottom = { hx: W / 2 + T, hy: T / 2, cx: 0, cy: -H / 2 - T / 2 };
    addBoxFixture(body, left);
    addBoxFixture(body, right);
    addBoxFixture(body, bottom);

    super(game, body);

    const ppm = config.world.pixelsPerMeter;
    const g = new Graphics();
    drawLocalBox(g, left, ppm, color);
    drawLocalBox(g, right, ppm, color);
    drawLocalBox(g, bottom, ppm, color);
    this.view = g;
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

function drawLocalBox(g, { hx, hy, cx, cy }, ppm, color) {
  g.rect((cx - hx) * ppm, (-cy - hy) * ppm, hx * ppm * 2, hy * ppm * 2).fill(color);
}
