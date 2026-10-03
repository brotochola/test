import { Container, Graphics, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

export class Tutorial {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.stage = null;
    this._t = 0;
    this._saved = 0;
    this._kind = null;
    this._target = null;
    this._allow = { faucet: false, platform: false };
    this._arrowScale = 1;

    const cfg = config.tutorial;
    this.root = new Container();
    this.root.zIndex = config.zIndex.tutorial;
    this.root.eventMode = "passive";
    this.root.visible = false;

    this.overlay = new Graphics();
    this.overlay.eventMode = "static";
    this.root.addChild(this.overlay);

    this.fox = Sprite.from(assetUrl("fox-guide.png"));
    this.fox.anchor.set(0, 1);
    this.fox.eventMode = "none";
    fitWidth(this.fox, cfg.foxW);
    this.fox.position.set(cfg.foxX, config.app.height - cfg.foxPad);
    this.root.addChild(this.fox);

    this.bubble = Sprite.from(assetUrl("speech-bubble.png"));
    this.bubble.anchor.set(0, 0.5);
    this.bubble.eventMode = "none";
    fitWidth(this.bubble, cfg.bubbleW);
    this.bubble.position.set(
      this.fox.x + this.fox.width - cfg.bubbleOverlap,
      this.fox.y - this.fox.height * 0.55,
    );
    this.root.addChild(this.bubble);

    this.speech = new Text({
      text: "",
      style: {
        fill: config.ui.ink,
        fontSize: cfg.bubbleFontSize,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
        align: "center",
        wordWrap: true,
        wordWrapWidth: cfg.bubbleW - cfg.bubblePadX * 2,
      },
    });
    this.speech.anchor.set(0.5);
    this.speech.eventMode = "none";
    this.speech.position.set(
      this.bubble.x + this.bubble.width * 0.54,
      this.bubble.y - cfg.bubblePadY,
    );
    this.root.addChild(this.speech);

    this.arrow = Sprite.from(assetUrl("rotating-arrow.png"));
    this.arrow.anchor.set(0.5, 1);
    this.arrow.eventMode = "none";
    fitWidth(this.arrow, cfg.arrowW);
    this._arrowScale = this.arrow.scale.x;
    this.arrow.visible = false;
    this.root.addChild(this.arrow);

    this.hand = Sprite.from(assetUrl("tutorial_hand.png"));
    this.hand.anchor.set(0.45, 0.08);
    this.hand.eventMode = "none";
    const tw = this.hand.texture.width || 1;
    const th = this.hand.texture.height || 1;
    this.hand.width = cfg.handW;
    this.hand.height = cfg.handW * (th / tw);
    this.root.addChild(this.hand);

    game.app.stage.addChild(this.root);
  }

  start(kind) {
    this.active = true;
    this.root.visible = true;
    this._t = 0;
    this._allow.faucet = false;
    this._allow.platform = false;
    this.speech.text =
      config.tutorial.copy[kind] ?? config.tutorial.copy.faucet;
    this.beginDemo(kind);
  }

  end() {
    this.active = false;
    this.stage = null;
    this._target = null;
    this._kind = null;
    this._allow.faucet = true;
    this._allow.platform = true;
    this.root.visible = false;
    this.arrow.visible = false;
    this.hand.rotation = 0;
    this.overlay.clear();
  }

  canAim(kind) {
    if (!this.active) return true;
    if (this.stage === `${kind}-demo`) return false;
    return this._allow[kind];
  }

  blockingPlay() {
    return this.active && this.stage !== "play";
  }

  onAimed(kind) {
    if (!this.active) return;
    if (this.stage === kind) this.beginPlay();
  }

  beginDemo(kind) {
    const target =
      kind === "faucet"
        ? this.game.faucets[0]
        : this.game.platforms.find((p) => p._rotate);
    if (!target) {
      this.beginPlay();
      return;
    }
    this._kind = kind;
    this.stage = `${kind}-demo`;
    this._target = target;
    this._saved = kind === "faucet" ? target.aim : target.body.GetAngle();
    this._t = 0;
  }

  beginPlay() {
    this.stage = "play";
    this._kind = "play";
    this._target = this.game.hud.playBtn;
    this._t = 0;
    this._allow.faucet = true;
    this._allow.platform = true;
    this.hand.rotation = 0;
    this.arrow.visible = false;
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    if (this.stage === "faucet-demo" || this.stage === "platform-demo") {
      this.stepDemo();
    }
    this.placeHand();
    this.placeArrow();
    // this.drawHole();
  }

  stepDemo() {
    const cfg = config.tutorial;
    const u = this._t / cfg.demoDuration;
    const kind = this._kind;
    const target = this._target;
    if (u >= 1) {
      if (kind === "faucet") target.setAim(this._saved);
      else target.setAngle(this._saved);
      this.stage = kind;
      this._allow[kind] = true;
      this._t = 0;
      return;
    }
    const a = this._saved + cfg.sweep * Math.sin(u * Math.PI);
    if (kind === "faucet") target.setAim(a);
    else target.setAngle(a);
  }

  placeHand() {
    const cfg = config.tutorial;
    if (this.stage === "play") {
      const btn = this.game.hud.playBtn;
      this.hand.x = btn.x + 10;
      this.hand.y = btn.y + 16 + Math.sin(this._t * cfg.bobSpeed) * cfg.bobAmp;
      this.hand.rotation = 0;
      return;
    }
    const obj = this._target;
    if (!obj?.container) return;
    const p = obj.container.position;
    const u = Math.sin((this._t / cfg.demoDuration) * Math.PI);
    const a = cfg.handArc * u;
    this.hand.x = p.x + Math.cos(a) * cfg.handRadius;
    this.hand.y = p.y + Math.sin(a) * cfg.handRadius;
    this.hand.rotation = a - Math.PI / 2;
  }

  placeArrow() {
    const cfg = config.tutorial;
    const obj = this._target;
    const show = this.stage !== "play" && obj?.container;
    this.arrow.visible = !!show;
    if (!show) return;
    const p = obj.container.position;
    this.arrow.position.set(p.x, p.y + 50);
    const s = 1 + Math.sin(this._t * cfg.arrowSpeed) * cfg.arrowPulse;
    this.arrow.scale.set(this._arrowScale * s);
    this.arrow.scale.y *= -1;
  }

  drawHole() {
    const g = this.overlay;
    g.clear();
    const w = config.app.width;
    const h = config.app.height;
    const fill = { color: config.ui.dim, alpha: config.tutorial.dimAlpha };
    const pad = config.tutorial.holePad;
    const node =
      this.stage === "play" ? this.game.hud.playBtn : this._target?.container;
    if (!node) {
      g.rect(0, 0, w, h).fill(fill);
      return;
    }
    const b = node.getBounds();
    const hx = Math.max(0, b.x - pad);
    const hy = Math.max(0, b.y - pad);
    const hw = Math.max(0, Math.min(w - hx, b.width + pad * 2));
    const hh = Math.max(0, Math.min(h - hy, b.height + pad * 2));
    if (hy > 0) g.rect(0, 0, w, hy).fill(fill);
    if (hy + hh < h) g.rect(0, hy + hh, w, h - hy - hh).fill(fill);
    if (hx > 0 && hh > 0) g.rect(0, hy, hx, hh).fill(fill);
    if (hx + hw < w && hh > 0) g.rect(hx + hw, hy, w - hx - hw, hh).fill(fill);
  }
}

function fitWidth(sprite, w) {
  const tw = sprite.texture.width || 1;
  const th = sprite.texture.height || 1;
  sprite.width = w;
  sprite.height = w * (th / tw);
}
