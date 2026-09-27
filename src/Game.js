import { Application, Container } from '../pixi.min.mjs';
import { config } from '../config.js';
import { Box } from './Box.js';
import { LiquidParticles } from './LiquidParticles.js';

export class Game {
  constructor() {
    this.app = new Application();
    this.mainContainer = new Container();
    this.objects = [];
    this.world = null;
    this.liquid = null;
  }

  async start() {
    const lf = window.liquidfun;
    if (!lf) throw new Error('liquidfun.min.js must load before the game module');

    await this.app.init({
      width: config.app.width,
      height: config.app.height,
      background: config.app.background,
      preference: config.app.preference,
      antialias: config.app.antialias,
    });
    document.body.appendChild(this.app.canvas);
    this.app.stage.addChild(this.mainContainer);

    this.world = new lf.b2World(new lf.b2Vec2(config.world.gravityX, config.world.gravityY));
    window.world = this.world;

    new Box(this, { ...config.demo.floor, type: lf.b2_staticBody });
    new Box(this, { ...config.demo.leftWall, type: lf.b2_staticBody });
    new Box(this, { ...config.demo.rightWall, type: lf.b2_staticBody });
    new Box(this, config.demo.crate);

    this.liquid = new LiquidParticles(this);
    this.liquid.spawnBox(config.demo.water);

    this.app.ticker.add(() => this.tick());
  }

  toScreen(x, y) {
    return {
      x: config.world.originX + x * config.world.pixelsPerMeter,
      y: config.world.originY - y * config.world.pixelsPerMeter,
    };
  }

  tick() {
    this.world.Step(
      config.world.timeStep,
      config.world.velocityIterations,
      config.world.positionIterations,
    );
    for (let i = 0; i < this.objects.length; i++) this.objects[i].update();
    this.liquid.sync();
  }
}
