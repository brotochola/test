import { Graphics } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";

export class Box extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const type = options.type ?? lf.b2_dynamicBody;
    const density =
      options.density ??
      (type === lf.b2_staticBody
        ? config.box.staticDensity
        : config.box.density);

    const def = new lf.b2BodyDef();
    def.type = type;
    def.position.Set(options.x, options.y);
    def.angle = options.angle ?? 0;
    const body = game.world.CreateBody(def);

    const shape = new lf.b2PolygonShape();
    shape.SetAsBoxXY(options.hx, options.hy);
    const fd = new lf.b2FixtureDef();
    fd.shape = shape;
    fd.density = density;
    fd.friction = options.friction ?? config.box.friction;
    fd.restitution = options.restitution ?? config.box.restitution;
    body.CreateFixtureFromDef(fd);

    const ppm = config.world.pixelsPerMeter;
    const w = options.hx * ppm * 2;
    const h = options.hy * ppm * 2;

    super(game, body);

    this.view = new Graphics().rect(-w / 2, -h / 2, w, h).fill(options.color);
    this.container.addChild(this.view);
  }
}
