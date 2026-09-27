import { Graphics } from './vendor/pixi.min.mjs';
import { config } from './config.js';
import { GameObject } from './GameObject.js';

export class Faucet extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const hx = options.hx ?? config.faucet.hx;
    const hy = options.hy ?? config.faucet.hy;

    const def = new lf.b2BodyDef();
    def.type = lf.b2_staticBody;
    def.position.Set(options.x, options.y);
    def.angle = options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const shape = new lf.b2PolygonShape();
    shape.SetAsBoxXY(hx, hy);
    const fd = new lf.b2FixtureDef();
    fd.shape = shape;
    fd.density = config.box.staticDensity;
    fd.friction = config.box.friction;
    fd.restitution = config.box.restitution;
    body.CreateFixtureFromDef(fd);

    super(game, body);

    this.color = options.color;
    this.rate = options.rate ?? config.faucet.rate;
    this.acc = 0;
    this._nozzle = new lf.b2Vec2(
      0,
      options.nozzleY ?? -(hy + config.particles.radius),
    );
    this._localVel = new lf.b2Vec2(
      options.vx ?? 0,
      options.vy ?? -config.faucet.speed,
    );

    const ppm = config.world.pixelsPerMeter;
    const w = hx * ppm * 2;
    const h = hy * ppm * 2;
    this.view = new Graphics().rect(-w / 2, -h / 2, w, h).fill(options.fill);
    this.container.addChild(this.view);
  }

  step(dt) {
    this.acc += dt;
    const interval = 1 / this.rate;
    if (!(interval > 0) || interval === Infinity) return;
    while (this.acc >= interval) {
      this.acc -= interval;
      const origin = this.body.GetWorldPoint(this._nozzle);
      const vel = this.body.GetWorldVector(this._localVel);
      this.game.liquid.emit(origin.x, origin.y, vel.x, vel.y, this.color);
    }
  }
}
