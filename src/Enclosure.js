import { config } from "./config.js";
import { GameObject } from "./GameObject.js";
import { colliderHalf } from "./Platform.js";

export class Enclosure extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const margin = config.box.margin;
    const hx = colliderHalf(options.width, margin);
    const hy = colliderHalf(options.height, margin);

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
    fd.friction = options.friction ?? config.box.friction;
    fd.restitution = options.restitution ?? config.box.restitution;
    body.CreateFixtureFromDef(fd);

    super(game, body);
    this.container.zIndex = config.zIndex.platform;
  }
}
