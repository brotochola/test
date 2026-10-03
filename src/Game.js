import {
  Application,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
} from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl, loadFont, preloadAssets } from "./assets.js";
import { bounceTap } from "./ui.js";
import { Enclosure } from "./Enclosure.js";
import { Platform } from "./Platform.js";
import { Faucet } from "./Faucet.js";
import { Flask } from "./Flask.js";
import { LiquidParticles } from "./LiquidParticles.js";
import { ParticleFx } from "./ParticleFx.js";
import { Dialog } from "./Dialog.js";
import { Hud } from "./Hud.js";
import { Tutorial } from "./Tutorial.js";
import { Level1 } from "./levels/Level1.js";
import { Level2 } from "./levels/Level2.js";
import { Level3 } from "./levels/Level3.js";
import { Level4 } from "./levels/Level4.js";
import { SoundManager } from "./SoundManager.js";

const WIN = assetUrl("audio/level_won.mp3");
const LOSE = assetUrl("audio/level_lost.mp3");
const CLICK = assetUrl("audio/click.mp3");
const OPEN = assetUrl("audio/open_faucet.mp3");

export class Game {
  constructor() {
    window.game = this; //debug
    this.app = new Application();
    this.mainContainer = new Container();
    this.mainContainer.sortableChildren = true;
    this.objects = [];
    this.world = null;
    this.liquid = null;
    this.fx = null;
    this.flasks = [];
    this.faucets = [];
    this.platforms = [];
    this.debug = config.game.debug;
    this.acc = 0;
    this.checkAcc = 0;
    this.debugGfx = null;
    this.debugHud = null;
    this.hud = null;
    this.dialog = null;
    this.tutorial = null;
    this.levels = [new Level1(), new Level2(), new Level3(), new Level4()];
    this.levelIndex = 0;
    this.coins = 0;
    this.awarded = [false, false, false];
    this.paused = false;
    this.won = false;
    this.resolved = false;
    this.mode = "design";
    this.tutorialFaucetSeen = false;
    this.tutorialPlankSeen = false;
    this.splash = null;
    this.sound = new SoundManager();
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
    await Promise.all([
      preloadAssets(),
      loadFont(),
      this.sound.load(assetUrl("audio/coin.mp3")),
      this.sound.load(assetUrl("audio/faucet.wav")),
      this.sound.load(WIN),
      this.sound.load(LOSE),
      this.sound.load(CLICK),
      this.sound.load(OPEN),
    ]);
    document.body.appendChild(this.app.canvas);
    this.app.stage.sortableChildren = true;

    const bg = Sprite.from(assetUrl("bg.jpg"));
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
    this.tutorial = new Tutorial(this);
    this.dialog = new Dialog(this);
    this.showSplash();
    this.loadLevel(this.levels[this.levelIndex]);
    this.app.ticker.add((ticker) => this.tick(ticker));
  }

  showSplash() {
    const splash = new Container();
    splash.zIndex = config.zIndex.splash;
    splash.eventMode = "static";
    splash.hitArea = new Rectangle(0, 0, config.app.width, config.app.height);

    const img = Sprite.from(assetUrl("splash-screen.jpg"));
    img.width = config.app.width;
    img.height = config.app.height;
    img.eventMode = "none";
    splash.addChild(img);

    const scale = config.tutorial.splashPlayScale;
    const play = Sprite.from(assetUrl("play.png"));
    play.anchor.set(0.5);
    play.scale.set(scale);
    play.position.set(config.app.width / 2, config.tutorial.splashPlayY);
    play.eventMode = "static";
    play.cursor = "pointer";
    play.on("pointertap", () => {
      bounceTap(this, play, () => this.dismissSplash(), scale);
    });
    splash.addChild(play);

    this.splash = splash;
    this.app.stage.addChild(splash);
  }

  dismissSplash() {
    if (!this.splash?.visible) return;
    this.splash.visible = false;
    this.splash.eventMode = "none";
    this.maybeStartTutorial();
  }

  onVisibility() {
    if (document.hidden) {
      this.stopClocks();
      return;
    }
    if (!this.needsRotate()) this.startClocks();
  }

  needsRotate() {
    return (
      matchMedia("(pointer: coarse)").matches &&
      window.innerWidth > window.innerHeight
    );
  }

  stopClocks() {
    this.app.ticker.stop();
    this.acc = 0;
    this.checkAcc = 0;
    this.sound.suspend();
  }

  startClocks() {
    this.app.ticker.start();
    this.sound.resume();
  }

  loadLevel(level) {
    this.tutorial?.end();
    this.clearLevel();
    this.paused = false;
    this.won = false;
    this.resolved = false;
    this.mode = "design";
    this.checkAcc = 0;
    this.acc = 0;
    if (this.dialog) this.dialog.hide();
    const spec = level.config;
    const walls = level.enclosure();
    for (let i = 0; i < walls.length; i++) new Enclosure(this, walls[i]);
    this.platforms = [];
    const platforms = spec.platforms ?? [];
    for (let i = 0; i < platforms.length; i++) {
      this.platforms.push(new Platform(this, platforms[i]));
    }

    const flaskSpecs = spec.flasks ?? [];
    const flasks = [];
    for (let i = 0; i < flaskSpecs.length; i++) {
      flasks.push(new Flask(this, flaskSpecs[i]));
    }
    this.flasks = flasks;

    this.liquid = new LiquidParticles(this);
    this.fx = new ParticleFx(this);

    this.faucets = [];
    const faucets = spec.faucets ?? [];
    for (let i = 0; i < faucets.length; i++) {
      this.faucets.push(new Faucet(this, faucets[i]));
    }

    if (this.hud) {
      this.hud.setLevel(this.levelIndex + 1);
      this.hud.setCoins(this.coins);
      this.hud.setPlaying(false);
      this.hud.setPlayEnabled(true);
    }
    this.maybeStartTutorial();
  }

  maybeStartTutorial() {
    if (this.splash?.visible) return;
    if (this.levelIndex === 0 && !this.tutorialFaucetSeen) {
      this.tutorial?.start("faucet");
    } else if (this.levelIndex === 1 && !this.tutorialPlankSeen) {
      this.tutorial?.start("platform");
    }
  }

  canAim(kind) {
    if (this.mode !== "design") return false;
    if (!this.tutorial) return true;
    return this.tutorial.canAim(kind);
  }

  onAimed(kind) {
    this.tutorial?.onAimed(kind);
  }

  click() {
    this.sound.unlock();
    this.sound.play(CLICK, { volume: 0.55 });
  }

  play() {
    this.sound.unlock();
    if (this.mode === "play" || this.paused) return;
    if (this.tutorial?.blockingPlay()) return;
    if (this.levelIndex === 0) this.tutorialFaucetSeen = true;
    else if (this.levelIndex === 1) this.tutorialPlankSeen = true;
    this.tutorial?.end();
    this.mode = "play";
    this.hud.setPlaying(true);
    this.sound.play(OPEN, { volume: 0.5 });
  }

  restartLevel() {
    this.resetPlay();
  }

  resetPlay() {
    this.paused = false;
    this.won = false;
    this.resolved = false;
    this.mode = "design";
    this.checkAcc = 0;
    this.acc = 0;
    this.dialog?.hide();

    const faucets = this.faucets;
    for (let i = 0; i < faucets.length; i++) faucets[i].reset();
    const flasks = this.flasks;
    for (let i = 0; i < flasks.length; i++) flasks[i].resetCount();

    const world = this.world;
    if (this.liquid) {
      world.DestroyParticleSystem(this.liquid.system);
      this.liquid.root.destroy();
      this.liquid = null;
    }
    if (this.fx) {
      this.fx.destroy();
      this.fx = null;
    }
    this.liquid = new LiquidParticles(this);
    this.fx = new ParticleFx(this);

    if (this.hud) {
      this.hud.setCoins(this.coins);
      this.hud.setPlaying(false);
      this.hud.setPlayEnabled(true);
    }
  }

  nextLevel() {
    if (this.levelIndex >= this.levels.length - 1) return;
    this.levelIndex += 1;
    this.loadLevel(this.levels[this.levelIndex]);
  }

  onWin(n) {
    if (this.won) return;
    this.won = true;
    this.sound.play(WIN, { volume: 0.7 });
    const first = !this.awarded[this.levelIndex];
    const earned = first && Number.isFinite(n) ? n : 0;
    if (first) {
      this.coins += earned;
      this.awarded[this.levelIndex] = true;
    }
    this.hud?.setCoins(this.coins);
    this.dialog.show({
      earned,
      last: this.levelIndex >= this.levels.length - 1,
      level: this.levelIndex + 1,
      levels: this.levels.length,
    });
  }

  onLose() {
    // this.paused = true;
    this.sound.play(LOSE, { volume: 0.7 });
    this.dialog.show({
      earned: 0,
      last: false,
      level: this.levelIndex + 1,
      levels: this.levels.length,
      lost: true,
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
    this.faucets = [];
    this.platforms = [];
    if (this.liquid) {
      world.DestroyParticleSystem(this.liquid.system);
      this.liquid.root.destroy();
      this.liquid = null;
    }
    if (this.fx) {
      this.fx.destroy();
      this.fx = null;
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

    const rotate = this.needsRotate();
    document.getElementById("rotate")?.classList.toggle("on", rotate);
    if (rotate) this.stopClocks();
    else if (!document.hidden) this.startClocks();
  }

  toScreen(x, y) {
    return {
      x: config.world.originX + x * config.world.pixelsPerMeter,
      y: config.world.originY - y * config.world.pixelsPerMeter,
    };
  }

  tick(ticker) {
    const dt = ticker.deltaMS / 1000;
    if (this.tutorial?.active) this.tutorial.update(dt);

    if (this.paused) {
      this.updateDebug(ticker, 0, 0, 0);
      return;
    }

    if (this.mode !== "play") {
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
      if (this.liquid) this.liquid.cullBelow();
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
    this.updateFlasks(ticker);
    if (this.fx) this.fx.update(dt);
    this.updateDebug(ticker, n, physMs, drawMs);
  }

  sampleFlasks() {
    const flasks = this.flasks;
    const results = [];
    let n = 0;
    for (let i = 0; i < flasks.length; i++) {
      const result = flasks[i].sample(this.liquid);
      results.push(result);
      n += flasks[i].fillCount;
    }
    // Live total previews this pour. Once banked, the pour is already in this.coins.
    const preview = this.awarded[this.levelIndex] ? 0 : n;
    this.hud.setCoins((this.coins ?? 0) + preview);
    return { results, n };
  }

  updateFlasks(ticker) {
    if (!this.liquid) return;
    this.checkAcc += ticker.deltaMS / 1000;
    if (this.checkAcc < config.flask.checkEvery) return;
    this.checkAcc = 0;
    const { results, n } = this.sampleFlasks();
    if (this.resolved) return;
    if (allFlasksPass(results)) {
      this.resolved = true;
      this.onWin(n);
      return;
    }
    const faucets = this.faucets;
    for (let i = 0; i < faucets.length; i++) {
      if (faucets[i].emitted < faucets[i].amount) return;
    }
    let need = 0;
    const flasks = this.flasks;
    for (let i = 0; i < flasks.length; i++) need += flasks[i].need;
    if (this.liquid.particleCount() < need) {
      this.resolved = true;
      this.onLose();
    }
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

export function allFlasksPass(results) {
  if (results.length === 0) return false;
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) return false;
  }
  return true;
}
