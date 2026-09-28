import {
  Application,
  Assets,
  Container,
  Graphics,
  Sprite,
  Text,
} from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { Box } from "./Box.js";
import { Faucet } from "./Faucet.js";
import { Flask } from "./Flask.js";
import { LiquidParticles } from "./LiquidParticles.js";
import { DemoLevel } from "./levels/DemoLevel.js";

export class Game {
  constructor() {
    window.game = this; //debug
    this.app = new Application();
    this.mainContainer = new Container();
    this.mainContainer.sortableChildren = true;
    this.objects = [];
    this.world = null;
    this.liquid = null;
    this.debug = config.game.debug;
    this.acc = 0;
    this.debugGfx = null;
    this.debugHud = null;
    this._onResize = () => this.layout();
  }

  async start() {
    const lf = window.liquidfun;
    if (!lf)
      throw new Error("liquidfun.min.js must load before the game module");

    await this.app.init({
      width: config.app.width,
      height: config.app.height,
      background: config.app.background,
      preference: config.app.preference,
      antialias: config.app.antialias,
    });

    globalThis.__PIXI_APP__ = this.app;
    const bgSrc = new URL("./assets/bg.jpg", import.meta.url).href;
    await Assets.load([
      bgSrc,
      new URL("./assets/flask1.png", import.meta.url).href,
      new URL("./assets/flask2.png", import.meta.url).href,
    ]);
    document.body.appendChild(this.app.canvas);
    const bg = Sprite.from(bgSrc);
    bg.width = config.app.width;
    bg.height = config.app.height;
    bg.zIndex = config.zIndex.bg;
    this.mainContainer.addChild(bg);
    this.app.stage.addChild(this.mainContainer);
    this.layout();
    window.addEventListener("resize", this._onResize);
    window.addEventListener("orientationchange", this._onResize);

    this.world = new lf.b2World(
      new lf.b2Vec2(config.world.gravityX, config.world.gravityY),
    );
    window.world = this.world;

    this.debugGfx = new Graphics();
    this.debugGfx.zIndex = config.zIndex.debug;
    this.mainContainer.addChild(this.debugGfx);
    this.debugHud = new Text({
      text: "",
      style: {
        fill: config.debug.hudFill,
        fontSize: config.debug.hudFontSize,
        fontFamily: "monospace",
      },
    });
    this.debugHud.position.set(config.debug.hudX, config.debug.hudY);
    this.debugHud.visible = this.debug;
    this.app.stage.addChild(this.debugHud);

    this.loadLevel(new DemoLevel());
    this.app.ticker.add((ticker) => this.tick(ticker));
  }

  loadLevel(level) {
    this.clearLevel();
    const spec = level.config;
    const boxes = level.enclosure().concat(spec.boxes ?? []);
    for (let i = 0; i < boxes.length; i++) new Box(this, boxes[i]);

    const flaskSpecs = spec.flasks ?? [];
    const flasks = [];
    for (let i = 0; i < flaskSpecs.length; i++) {
      flasks.push(new Flask(this, flaskSpecs[i]));
    }

    this.liquid = new LiquidParticles(this);
    for (let i = 0; i < flasks.length; i++) {
      const flask = flasks[i];
      if (flask.amount > 0) {
        this.liquid.fillFlask(
          flask.body,
          flask.innerW,
          flask.innerH,
          flask.amount,
          config.flask.liquidColor,
          flask.fillX,
          flask.fillY,
        );
      }
    }

    const faucets = spec.faucets ?? [];
    for (let i = 0; i < faucets.length; i++) new Faucet(this, faucets[i]);
  }

  clearLevel() {
    const world = this.world;
    const objects = this.objects;
    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i];
      if (obj.body) world.DestroyBody(obj.body);
      if (obj.destroy) obj.destroy();
      else obj.container.destroy();
    }
    objects.length = 0;
    if (this.liquid) {
      world.DestroyParticleSystem(this.liquid.system);
      this.liquid.root.destroy();
      this.liquid = null;
    }
  }

  layout() {
    const canvas = this.app.canvas;
    const gw = config.app.width;
    const gh = config.app.height;
    const scale = Math.min(window.innerWidth / gw, window.innerHeight / gh);
    const w = gw * scale;
    const h = gh * scale;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.style.left = `${(window.innerWidth - w) / 2}px`;
    canvas.style.top = `${(window.innerHeight - h) / 2}px`;
  }

  toScreen(x, y) {
    return {
      x: config.world.originX + x * config.world.pixelsPerMeter,
      y: config.world.originY - y * config.world.pixelsPerMeter,
    };
  }

  tick(ticker) {
    const step = config.world.timeStep;
    this.acc += ticker.deltaMS / 1000;
    let n = 0;
    let physMs = 0;
    const max = config.world.maxSubSteps;
    // ponytail: drop leftover past maxSubSteps; raise maxSubSteps if the sim stutters under load
    while (this.acc >= step && n < max) {
      const t0 = performance.now();
      this.world.Step(
        step,
        config.world.velocityIterations,
        config.world.positionIterations,
      );
      physMs += performance.now() - t0;
      const objects = this.objects;
      for (let i = 0; i < objects.length; i++) {
        const obj = objects[i];
        if (obj.step) obj.step(step);
      }
      this.acc -= step;
      n++;
    }
    if (n === max) this.acc = 0;

    const tDraw = performance.now();
    if (n > 0) {
      for (let i = 0; i < this.objects.length; i++) this.objects[i].update();
      this.liquid.sync();
    }
    const drawMs = performance.now() - tDraw;

    this.updateDebug(ticker, n, physMs, drawMs);
  }

  updateDebug(ticker, n, physMs, drawMs) {
    const on = this.debug;
    this.debugHud.visible = on;
    if (!on) {
      this.debugGfx.clear();
      return;
    }

    const ms = config.debug.msDigits;
    const fps = ticker.FPS.toFixed(config.debug.fpsDigits);
    const perStep = n > 0 ? physMs / n : 0;
    const phys = perStep.toFixed(ms);
    const draw = drawMs.toFixed(ms);
    this.debugHud.text =
      n > 1
        ? `phys ${phys}ms ×${n}\ndraw ${draw}ms\nfps ${fps}`
        : `phys ${phys}ms\ndraw ${draw}ms\nfps ${fps}`;
    this.drawDebug();
  }

  drawDebug() {
    const g = this.debugGfx;
    g.clear();
    const lf = window.liquidfun;
    const bodies = this.world.bodies;
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const type = body.GetType();
      const color =
        type === lf.b2_staticBody
          ? config.debug.staticColor
          : type === lf.b2_kinematicBody
            ? config.debug.kinematicColor
            : config.debug.dynamicColor;
      const p = body.GetPosition();
      const a = body.GetAngle();
      const c = Math.cos(a);
      const s = Math.sin(a);
      const fixtures = body.fixtures;
      for (let f = 0; f < fixtures.length; f++) {
        const verts = fixtures[f].shape?.vertices;
        if (!verts || verts.length === 0) continue;
        const pts = [];
        for (let v = 0; v < verts.length; v++) {
          const vx = verts[v].x;
          const vy = verts[v].y;
          const screen = this.toScreen(
            p.x + vx * c - vy * s,
            p.y + vx * s + vy * c,
          );
          pts.push(screen.x, screen.y);
        }
        g.poly(pts);
        g.stroke({ width: config.debug.lineWidth, color });
      }
    }

    const buf = this.liquid.system.GetPositionBuffer();
    const count = buf.length / 2;
    const dot = config.debug.particleDot;
    const pc = config.debug.particleColor;
    for (let i = 0; i < count; i++) {
      const i2 = i * 2;
      const screen = this.toScreen(buf[i2], buf[i2 + 1]);
      g.rect(screen.x, screen.y, dot, dot);
    }
    if (count > 0) g.fill(pc);
  }
}
