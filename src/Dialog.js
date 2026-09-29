import { Container, Graphics, Rectangle, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

const BTN_W = 360;
const BTN_H = 56;
const FOX_W = 130;

export class Dialog {
  constructor(game) {
    this.game = game;
    this.root = new Container();
    this.root.zIndex = config.zIndex.dialog;
    this.root.visible = false;
    this.root.eventMode = "static";
    this._last = false;
    this._tweens = [];

    this.overlay = new Graphics()
      .rect(0, 0, config.app.width, config.app.height)
      .fill({ color: 0x000000, alpha: 1 });
    this.overlay.alpha = 0;
    this.overlay.eventMode = "static";
    this.root.addChild(this.overlay);

    this.card = new Container();
    this.card.position.set(config.app.width / 2, config.app.height / 2);
    this.root.addChild(this.card);

    this.panel = Sprite.from(assetUrl("panel.png"));
    this.panel.anchor.set(0.5);
    fitWidth(this.panel, config.app.width);
    this.card.addChild(this.panel);

    this.foxHappy = Sprite.from(assetUrl("fox-happy.png"));
    this.foxHappy.anchor.set(0.5);
    fitWidth(this.foxHappy, FOX_W);
    this.card.addChild(this.foxHappy);

    this.foxCta = Sprite.from(assetUrl("fox-cta.png"));
    this.foxCta.anchor.set(0.5);
    fitWidth(this.foxCta, FOX_W);
    this.foxCta.visible = false;
    this.card.addChild(this.foxCta);

    this.title = label("Level complete!", config.ui.titleSize, config.ui.ink);
    this.progress = label("", 22, config.ui.ink);
    this.dots = new Graphics();
    this.earned = label("", config.ui.fontSize, config.ui.orange);
    this.card.addChild(this.title, this.progress, this.dots, this.earned);

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
    const pad = h * 0.16;
    this.foxHappy.position.set(0, top);
    this.foxCta.position.set(0, top);
    this.next.root.y = h / 2 - pad - BTN_H / 2;
    this.again.root.y = this.next.root.y - BTN_H - 12;
    this.ctaNote.y = h / 2 + 22;
    const textTop = top + pad + 8;
    const textBot = this.again.root.y - BTN_H / 2 - 8;
    const span = textBot - textTop;
    this.title.y = textTop + span * 0.18;
    this.progress.y = textTop + span * 0.42;
    this.dots.position.set(0, textTop + span * 0.62);
    this.earned.y = textTop + span * 0.86;
  }

  onNext() {
    if (this._last) {
      console.log("CTA clicked — demo only");
      this.ctaNote.visible = true;
      return;
    }
    this.game.nextLevel();
  }

  show({ earned, last, level, levels }) {
    this.stopTweens();
    this._last = last;
    this.root.visible = true;
    this.ctaNote.visible = false;
    this.foxHappy.visible = !last;
    this.foxCta.visible = last;
    this.title.text = last ? "All mixed!" : "Level complete!";
    this.progress.text = `Level ${level} of ${levels}`;
    this.earned.text = earned > 0 ? `+${earned} coins` : "Already collected";
    this.next.text.text = last ? "Explore Scrambly" : "Next";
    this.again.root.scale.set(1);
    this.next.root.scale.set(1);
    drawDots(this.dots, level, levels);

    this.overlay.alpha = 0;
    this.card.scale.set(0.55);
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
  }

  hide() {
    this.stopTweens();
    this.root.visible = false;
    this.overlay.alpha = 0;
    this.card.scale.set(1);
    this.card.interactiveChildren = true;
    this.again.root.scale.set(1);
    this.next.root.scale.set(1);
  }

  bounceTap(node, fn) {
    this.playTween({
      duration: 0.28,
      onUpdate: (u) => {
        const s =
          u < 0.5 ? 1 + 0.08 * (u / 0.5) : 1.08 - 0.08 * ((u - 0.5) / 0.5);
        node.scale.set(s);
      },
      onDone: fn,
    });
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
      fontSize: config.ui.fontSize,
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
      g.circle(x, 0, r).stroke({ width: 3, color: config.ui.orange, alpha: 0.35 });
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

if (bounceOut(0) !== 0 || Math.abs(bounceOut(1) - 1) > 1e-9)
  throw new Error("bounceOut");

function quadOut(t) {
  return 1 - (1 - t) * (1 - t);
}

function tween(app, { duration, ease, onUpdate, onDone }) {
  let t = 0;
  let done = false;
  const tick = (ticker) => {
    if (done) return;
    t += ticker.deltaMS / 1000;
    const u = Math.min(1, t / duration);
    onUpdate(ease ? ease(u) : u);
    if (u >= 1) {
      done = true;
      app.ticker.remove(tick);
      onDone?.();
    }
  };
  app.ticker.add(tick);
  return () => {
    if (done) return;
    done = true;
    app.ticker.remove(tick);
  };
}
