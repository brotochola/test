import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
} from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl, preloadAssets } from "./assets.js";
import { Box } from "./Box.js";
import { Faucet } from "./Faucet.js";
import { Flask } from "./Flask.js";
import { LiquidParticles } from "./LiquidParticles.js";
import { Dialog } from "./Dialog.js";
import { Hud } from "./Hud.js";
import { Level1 } from "./levels/Level1.js";
import { Level2 } from "./levels/Level2.js";
import { Level3 } from "./levels/Level3.js";

export class Game {
  constructor() {
    window.game = this; //debug
    this.app = new Application();
    this.mainContainer = new Container();
    this.mainContainer.sortableChildren = true;
    this.objects = [];
    this.world = null;
    this.liquid = null;
    this.flasks = [];
    this.debug = config.game.debug;
    this.acc = 0;
    this.checkAcc = 0;
    this.debugGfx = null;
    this.debugHud = null;
    this.hud = null;
    this.dialog = null;
    this.levels = [new Level1(), new Level2(), new Level3()];
    this.levelIndex = 0;
    this.coins = 0;
    this.awarded = [false, false, false];
    this.paused = false;
    this.won = false;
    this._onResize = () => this.layout();
    this._onVisibility = () => this.onVisibility();
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
    await preloadAssets();
    document.body.appendChild(this.app.canvas);
    this.app.stage.sortableChildren = true;

    const bg = Sprite.from(assetUrl("bg.png"));
    bg.width = config.app.width;
    bg.height = config.app.height;
    bg.zIndex = config.zIndex.bg;
    this.mainContainer.zIndex = 0;
    this.mainContainer.addChild(bg);
    this.app.stage.addChild(this.mainContainer);
    this.layout();
    window.addEventListener("resize", this._onResize);
    window.addEventListener("orientationchange", this._onResize);
    document.addEventListener("visibilitychange", this._onVisibility);

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
    this.debugHud.zIndex = config.zIndex.debug + 10;
    this.debugHud.visible = this.debug;
    this.app.stage.addChild(this.debugHud);

    this.hud = new Hud(this);
    this.dialog = new Dialog(this);
    this.loadLevel(this.levels[this.levelIndex]);
    this.app.ticker.add((ticker) => this.tick(ticker));
  }

  onVisibility() {
    if (document.hidden) {
      this.app.ticker.stop();
      this.acc = 0;
      this.checkAcc = 0;
      return;
    }
    this.app.ticker.start();
  }

  loadLevel(level) {
    this.clearLevel();
    this.paused = false;
    this.won = false;
    this.checkAcc = 0;
    if (this.dialog) this.dialog.hide();
    const spec = level.config;
    const boxes = level.enclosure().concat(spec.boxes ?? []);
    for (let i = 0; i < boxes.length; i++) new Box(this, boxes[i]);

    const flaskSpecs = spec.flasks ?? [];
    const flasks = [];
    for (let i = 0; i < flaskSpecs.length; i++) {
      flasks.push(new Flask(this, flaskSpecs[i]));
    }
    this.flasks = flasks;

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

    if (this.hud) {
      this.hud.setLevel(this.levelIndex + 1);
      this.hud.setCoins(this.coins);
    }
  }

  restartLevel() {
    this.loadLevel(this.levels[this.levelIndex]);
  }

  nextLevel() {
    if (this.levelIndex >= this.levels.length - 1) return;
    this.levelIndex += 1;
    this.loadLevel(this.levels[this.levelIndex]);
  }

  onWin() {
    if (this.won) return;
    this.won = true;
    this.paused = true;
    const first = !this.awarded[this.levelIndex];
    const earned = first ? (this.levels[this.levelIndex].config.coins ?? 50) : 0;
    if (first) {
      this.coins += earned;
      this.awarded[this.levelIndex] = true;
    }
    this.hud.setCoins(this.coins);
    this.dialog.show({
      earned,
      total: this.coins,
      last: this.levelIndex >= this.levels.length - 1,
    });
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
    this.flasks = [];
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
    if (this.paused) {
      this.updateDebug(ticker, 0, 0, 0);
      return;
    }

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
    this.checkWin(ticker);
    this.updateDebug(ticker, n, physMs, drawMs);
  }

  checkWin(ticker) {
    if (this.paused || this.won || !this.liquid) return;
    this.checkAcc += ticker.deltaMS / 1000;
    if (this.checkAcc < config.flask.checkEvery) return;
    this.checkAcc = 0;
    const flasks = this.flasks;
    if (flasks.length === 0) return;
    for (let i = 0; i < flasks.length; i++) {
      if (!flasks[i].matches(this.liquid)) return;
    }
    this.onWin();
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
    if (!this.world || !this.liquid) return;
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
