import { Graphics } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { GameObject } from "./GameObject.js";

export function colliderHalf(size, margin) {
  return size / 2 + margin;
}

export function spriteSize(width, height, ppm) {
  return { w: width * ppm, h: height * ppm };
}

export class Box extends GameObject {
  constructor(game, options) {
    const lf = window.liquidfun;
    const type = options.type ?? lf.b2_dynamicBody;
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

    const sprite = spriteSize(
      options.width,
      options.height,
      config.world.pixelsPerMeter,
    );

    super(game, body);
    this.container.zIndex = config.zIndex.box;

    this.view = new Graphics()
      .rect(-sprite.w / 2, -sprite.h / 2, sprite.w, sprite.h)
      .fill(options.color);
    this.container.addChild(this.view);
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
