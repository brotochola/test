import {
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
} from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";
import { bounceTap, tween } from "./ui.js";

const BTN_W = 260;
const BTN_H = 78;
const BTN_GAP = 16;
const FOX_W = 200;
const BUBBLE_MAX = 18;
const BUBBLE_RATE = 0.12;

export class Dialog {
  constructor(game) {
    this.game = game;
    this.root = new Container();
    this.root.zIndex = config.zIndex.dialog;
    this.root.visible = false;
    this.root.eventMode = "static";
    this._last = false;
    this._tweens = [];
    this._bubbleLive = [];
    this._bubblePool = [];
    this._emitAcc = 0;
    this._onBubbles = (ticker) => this.stepBubbles(ticker.deltaMS / 1000);

    this.overlay = new Graphics()
      .rect(0, 0, config.app.width, config.app.height)
      .fill({ color: 0x000000, alpha: 1 });
    this.overlay.alpha = 0;
    this.overlay.eventMode = "static";
    this.root.addChild(this.overlay);

    this.card = new Container();
    this.card.position.set(config.app.width / 2, config.app.height / 2);
    this.root.addChild(this.card);

    this.bubbles = new Container();
    this.card.addChild(this.bubbles);

    this.panel = Sprite.from(assetUrl("panel.png"));
    this.panel.anchor.set(0.5);
    fitWidth(this.panel, config.app.width);
    this.card.addChild(this.panel);

    this.fox = new Container();
    this.foxHappy = Sprite.from(assetUrl("fox-happy.png"));
    this.foxHappy.anchor.set(0.5);
    fitWidth(this.foxHappy, FOX_W);
    this.foxCta = Sprite.from(assetUrl("fox-cta.png"));
    this.foxCta.anchor.set(0.5);
    fitWidth(this.foxCta, FOX_W);
    this.foxCta.visible = false;
    this.foxSad = Sprite.from(assetUrl("fox-sad.png"));
    this.foxSad.anchor.set(0.5);
    fitWidth(this.foxSad, FOX_W);
    this.foxSad.visible = false;
    this.fox.addChild(this.foxHappy, this.foxCta, this.foxSad);
    this.card.addChild(this.fox);

    this.title = label("Level complete!", config.ui.titleSize, config.ui.ink);
    this.progress = label("", 22, config.ui.ink);
    this.dots = new Graphics();
    this.earned = label("", config.ui.fontSize, config.ui.orange);
    this.demo = label("demo rewards", 18, config.ui.purple);
    this.card.addChild(
      this.title,
      this.progress,
      this.dots,
      this.earned,
      this.demo,
    );

    this.again = labeledButton(
      "btn-secondary.png",
      "Play again",
      config.ui.ink,
      config.ui.cream,
      () => this.bounceTap(this.again.root, () => game.restartLevel()),
    );
    this.next = labeledButton(
      "btn-primary.png",
      "Next",
      config.ui.cream,
      config.ui.orange,
      () => this.bounceTap(this.next.root, () => this.onNext()),
    );
    this.card.addChild(this.again.root, this.next.root);

    this.ctaNote = label("CTA clicked — demo only", 22, config.ui.purple);
    this.ctaNote.visible = false;
    this.card.addChild(this.ctaNote);

    this.layoutCard();
    game.app.stage.addChild(this.root);
  }

  layoutCard() {
    const h = this.panel.height;
    const top = -h / 2;
    const bot = h / 2;
    this.fox.position.set(0, top - this.foxHappy.height * 0.38);
    this.title.y = top + 58;
    this.progress.y = this.title.y + 46;
    this.dots.position.set(0, this.progress.y + 34);
    this.earned.y = this.dots.y + 34;
    this.demo.y = this.earned.y + 30;
    this.next.root.y = bot - 74;
    this.again.root.y = this.next.root.y - BTN_H - BTN_GAP;
    this.ctaNote.y = bot + 22;
  }

  onNext() {
    if (this._last) {
      console.log("CTA clicked — demo only");
      this.ctaNote.visible = true;
      return;
    }
    this.game.nextLevel();
  }

  show({ earned, last, level, levels, lost }) {
    this.stopTweens();
    this.stopBubbles();
    this._last = last;
    this.root.visible = true;
    this.ctaNote.visible = false;
    this.foxHappy.visible = !lost && !last;
    this.foxCta.visible = last && !lost;
    this.foxSad.visible = !!lost;
    this.title.text = lost
      ? "Not quite"
      : last
        ? "All mixed!"
        : "Level complete!";
    this.progress.text = `Level ${level} of ${levels}`;
    this.earned.visible = !lost;
    this.demo.visible = !lost;
    this.earned.text = earned > 0 ? `+${earned}` : "Already collected";
    this.next.root.visible = !lost;
    this.next.text.text = last ? "Explore Scrambly" : "Next";
    this.again.root.y = lost
      ? this.next.root.y
      : this.next.root.y - BTN_H - BTN_GAP;
    this.again.root.scale.set(1);
    this.next.root.scale.set(1);
    drawDots(this.dots, level, levels);

    this.overlay.alpha = 0;
    this.card.scale.set(0.55);
    this.fox.scale.set(0);
    this.title.scale.set(0);
    this.card.interactiveChildren = false;

    this.playTween({
      duration: 0.2,
      ease: quadOut,
      onUpdate: (u) => {
        this.overlay.alpha = 0.5 * u;
      },
    });
    this.playTween({
      duration: 0.55,
      ease: bounceOut,
      onUpdate: (u) => {
        this.card.scale.set(0.55 + 0.45 * u);
      },
      onDone: () => {
        this.card.interactiveChildren = true;
      },
    });
    this.playTween({
      delay: 0.2,
      duration: 0.55,
      ease: bounceOut,
      onUpdate: (u) => {
        this.fox.scale.set(u);
      },
    });
    this.playTween({
      delay: 0.32,
      duration: 0.4,
      ease: bounceOut,
      onUpdate: (u) => {
        this.title.scale.set(u);
      },
    });
    this.startBubbles();
  }

  hide() {
    this.stopTweens();
    this.stopBubbles();
    this.root.visible = false;
    this.overlay.alpha = 0;
    this.card.scale.set(1);
    this.fox.scale.set(1);
    this.title.scale.set(1);
    this.card.interactiveChildren = true;
    this.again.root.scale.set(1);
    this.next.root.scale.set(1);
    this.next.root.visible = true;
    this.earned.visible = true;
    this.demo.visible = true;
    this.again.root.y = this.next.root.y - BTN_H - BTN_GAP;
  }

  bounceTap(node, fn) {
    this._tweens.push(bounceTap(this.game, node, fn));
  }

  playTween(opts) {
    const cancel = tween(this.game.app, opts);
    this._tweens.push(cancel);
    return cancel;
  }

  stopTweens() {
    for (let i = 0; i < this._tweens.length; i++) this._tweens[i]();
    this._tweens.length = 0;
  }

  startBubbles() {
    for (let i = 0; i < 8; i++) this.spawnBubble();
    this._emitAcc = 0;
    this.game.app.ticker.add(this._onBubbles);
  }

  stopBubbles() {
    this.game.app.ticker.remove(this._onBubbles);
    while (this._bubbleLive.length) this.releaseBubble(this._bubbleLive.pop());
  }

  spawnBubble() {
    if (this._bubbleLive.length >= BUBBLE_MAX) return;
    const b = this._bubblePool.pop() || this.makeBubble();
    const hw = this.panel.width * 0.42;
    const hh = this.panel.height * 0.35;
    const size = 14 + Math.random() * 26;
    fitWidth(b.s, size);
    b.s.x = (Math.random() - 0.5) * hw * 2;
    b.s.y = (Math.random() - 0.2) * hh;
    b.s.alpha = 0.55 + Math.random() * 0.25;
    b.s.visible = true;
    b.s.rotation = Math.random() * Math.PI * 2;
    b.vx = (Math.random() - 0.5) * 28;
    b.vy = -(36 + Math.random() * 70);
    b.spin = (Math.random() - 0.5) * 1.4;
    b.age = 0;
    b.life = 1.1 + Math.random() * 1.3;
    this._bubbleLive.push(b);
  }

  makeBubble() {
    const s = Sprite.from(assetUrl("bubble.png"));
    s.anchor.set(0.5);
    this.bubbles.addChild(s);
    return { s, vx: 0, vy: 0, spin: 0, age: 0, life: 1 };
  }

  releaseBubble(b) {
    b.s.visible = false;
    b.s.alpha = 0;
    this._bubblePool.push(b);
  }

  stepBubbles(dt) {
    this._emitAcc += dt;
    while (this._emitAcc >= BUBBLE_RATE) {
      this._emitAcc -= BUBBLE_RATE;
      this.spawnBubble();
    }
    const live = this._bubbleLive;
    for (let i = live.length - 1; i >= 0; i--) {
      const b = live[i];
      b.age += dt;
      b.s.x += b.vx * dt;
      b.s.y += b.vy * dt;
      b.s.rotation += b.spin * dt;
      const t = b.age / b.life;
      b.s.alpha = Math.max(0, 0.7 * (1 - t));
      if (t >= 1) {
        live.splice(i, 1);
        this.releaseBubble(b);
      }
    }
  }
}

function fitWidth(sprite, w) {
  const tw = sprite.texture.width || 1;
  const th = sprite.texture.height || 1;
  sprite.width = w;
  sprite.height = w * (th / tw);
}

function label(text, fontSize, fill) {
  const t = new Text({
    text,
    style: {
      fill,
      fontSize,
      fontFamily: config.ui.fontFamily,
      fontWeight: "600",
      align: "center",
    },
  });
  t.anchor.set(0.5);
  return t;
}

function labeledButton(src, caption, fill, color, onTap) {
  const root = new Container();
  root.eventMode = "static";
  root.cursor = "pointer";
  root.hitArea = new Rectangle(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H);

  const gfx = new Graphics()
    .roundRect(-BTN_W / 2, -BTN_H / 2, BTN_W, BTN_H, 18)
    .fill(color);
  root.addChild(gfx);

  const bg = Sprite.from(assetUrl(src));
  bg.anchor.set(0.5);
  if (bg.texture.width > 1) {
    fitWidth(bg, BTN_W);
    gfx.visible = false;
  } else {
    bg.visible = false;
  }
  root.addChild(bg);

  const text = new Text({
    text: caption,
    style: {
      fill,
      fontSize: 24,
      fontFamily: config.ui.fontFamily,
      fontWeight: "600",
    },
  });
  text.anchor.set(0.5);
  root.addChild(text);
  root.on("pointertap", onTap);
  return { root, text, bg };
}

function drawDots(g, level, levels) {
  g.clear();
  const r = 8;
  const gap = 26;
  const w = (levels - 1) * gap;
  for (let i = 0; i < levels; i++) {
    const x = -w / 2 + i * gap;
    if (i < level) g.circle(x, 0, r).fill(config.ui.orange);
    else
      g.circle(x, 0, r).stroke({
        width: 3,
        color: config.ui.orange,
        alpha: 0.35,
      });
  }
}

function bounceOut(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function quadOut(t) {
  return 1 - (1 - t) * (1 - t);
}
