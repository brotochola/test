import { Container, Graphics, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";
import { tween } from "./ui.js";

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
    this._lifted = null;
    this._liftedParent = null;
    this._tweens = [];
    this._copy = "";
    this._typeI = 0;
    this._typeAcc = 0;
    this._typing = false;
    this._leaving = false;
    this._coachGone = false;

    const cfg = config.tutorial;
    this.root = new Container();
    this.root.zIndex = config.zIndex.tutorial;
    this.root.eventMode = "passive";
    this.root.visible = false;

    this.overlay = new Graphics()
      .rect(0, 0, config.app.width, config.app.height)
      .fill({ color: config.ui.dim, alpha: cfg.dimAlpha });
    this.overlay.eventMode = "static";
    this.root.addChild(this.overlay);

    this.spotlight = new Container();
    this.spotlight.eventMode = "passive";
    this.root.addChild(this.spotlight);

    this.fox = Sprite.from(assetUrl("fox-guide.png"));
    this.fox.anchor.set(1, 1);
    this.fox.eventMode = "none";
    fitWidth(this.fox, cfg.foxW);
    this.fox.position.set(430, config.app.height - cfg.foxPad);
    this.fox.scale.x *= -1;
    this._foxX = this.fox.x;
    this._foxY = this.fox.y;
    this._foxSx = this.fox.scale.x;
    this._foxSy = this.fox.scale.y;
    this.root.addChild(this.fox);

    this.bubble = Sprite.from(assetUrl("speech-bubble.png"));
    this.bubble.anchor.set(0.5);
    this.bubble.eventMode = "none";
    fitWidth(this.bubble, cfg.bubbleW);
    // this.bubble.scale.x *= -1;
    this.bubble.position.set(cfg.bubbleX, cfg.bubbleY);
    this._bubbleSx = this.bubble.scale.x;
    this._bubbleSy = this.bubble.scale.y;
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
    this.speech.position.set(cfg.bubbleX, cfg.bubbleY - cfg.bubblePadY);
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
    this.drop();
    this.stopTweens();
    this._leaving = false;
    this._coachGone = false;
    this.active = true;
    this.root.visible = true;
    this.root.eventMode = kind === "mix" ? "none" : "passive";
    this._t = 0;
    this._allow.faucet = false;
    this._allow.platform = false;
    this._copy = config.tutorial.copy[kind] ?? config.tutorial.copy.faucet;
    this.speech.text = "";
    this.speech.alpha = 1;
    this.speech.scale.set(1);
    this._typeI = 0;
    this._typeAcc = 0;
    this._typing = false;
    this.hand.visible = true;
    this.overlay.alpha = 1;
    this.overlay.eventMode = kind === "mix" ? "none" : "static";
    this.fox.position.set(this._foxX, this._foxY);
    this.fox.scale.set(0);
    this.bubble.scale.set(0);
    this.popIn();
    this.beginDemo(kind);
  }

  popIn() {
    const cfg = config.tutorial;
    this._tweens.push(
      tween(this.game.app, {
        duration: cfg.popDuration,
        ease: bounceOut,
        onUpdate: (u) => this.fox.scale.set(this._foxSx * u, this._foxSy * u),
      }),
    );
    this._tweens.push(
      tween(this.game.app, {
        delay: cfg.bubbleDelay,
        duration: cfg.popDuration,
        ease: bounceOut,
        onUpdate: (u) =>
          this.bubble.scale.set(this._bubbleSx * u, this._bubbleSy * u),
        onDone: () => {
          this._typing = true;
        },
      }),
    );
  }

  stopTweens() {
    for (let i = 0; i < this._tweens.length; i++) this._tweens[i]();
    this._tweens.length = 0;
  }

  end() {
    this.drop();
    this.active = false;
    this.stage = null;
    this._target = null;
    this._kind = null;
    this._allow.faucet = true;
    this._allow.platform = true;
    this._typing = false;
    this.arrow.visible = false;
    this.hand.visible = false;
    this.hand.rotation = 0;
    this.overlay.eventMode = "none";
    this.root.eventMode = "none";
    if (!this.root.visible || this._leaving) return;
    this.stopTweens();
    this._leaving = true;
    if (this._coachGone) {
      this.finishEnd();
      return;
    }
    this.popCoach(() => this.finishEnd());
  }

  dismissCoach() {
    this.overlay.eventMode = "none";
    this.root.eventMode = "none";
    this._typing = false;
    this.arrow.visible = false;
    if (this._coachGone) return;
    this._coachGone = true;
    this.stopTweens();
    this.popCoach();
  }

  popCoach(onDone) {
    const cfg = config.tutorial;
    const foxSx = this.fox.scale.x;
    const foxSy = this.fox.scale.y;
    const bSx = this.bubble.scale.x;
    const bSy = this.bubble.scale.y;
    const overlayA = this.overlay.alpha;
    this._tweens.push(
      tween(this.game.app, {
        duration: cfg.popDuration * 0.7,
        ease: quadIn,
        onUpdate: (u) => {
          const k = 1 - u;
          this.bubble.scale.set(bSx * k, bSy * k);
          this.speech.scale.set(k);
          this.speech.alpha = k;
          this.overlay.alpha = overlayA * k;
        },
      }),
    );
    const foxX = this.fox.x;
    const outX = config.app.width + Math.abs(this.fox.width) + 24;
    this._tweens.push(
      tween(this.game.app, {
        delay: cfg.bubbleDelay,
        duration: 0.5,
        onUpdate: (u) => {
          const squash = u < 0.3 ? Math.sin((u / 0.3) * Math.PI) : 0;
          this.fox.scale.set(
            foxSx * (1 + 0.2 * squash),
            foxSy * (1 - 0.25 * squash),
          );
          const slide = u < 0.22 ? 0 : quadIn((u - 0.22) / 0.78);
          this.fox.x = foxX + (outX - foxX) * slide;
        },
        onDone,
      }),
    );
  }

  finishEnd() {
    this._leaving = false;
    this._coachGone = false;
    this.root.visible = false;
    this.root.eventMode = "none";
    this.hand.visible = true;
    this.fox.position.set(this._foxX, this._foxY);
    this.fox.scale.set(this._foxSx, this._foxSy);
    this.bubble.scale.set(this._bubbleSx, this._bubbleSy);
    this.speech.scale.set(1);
    this.speech.alpha = 1;
    this.overlay.alpha = 1;
  }

  lift(node) {
    this.drop();
    if (!node) return;
    this._lifted = node;
    this._liftedParent = node.parent;
    this.spotlight.addChild(node);
  }

  drop() {
    const node = this._lifted;
    if (!node) return;
    this._liftedParent?.addChild(node);
    this._lifted = null;
    this._liftedParent = null;
  }

  canAim(kind) {
    if (!this.active) return true;
    if (this.stage === "play") return true;
    if (this.stage === `${kind}-demo`) return true;
    return !!this._allow[kind];
  }

  blockingPlay() {
    return this.active && this.stage !== "play";
  }

  onAimed(kind) {
    if (!this.active || this.stage === "play") return;
    if (this.stage === "mix") {
      if (kind !== "faucet" && kind !== "platform") return;
    } else if (
      this.stage !== kind &&
      this.stage !== `${kind}-demo`
    ) {
      return;
    }
    this.dismissCoach();
    this.beginPlay();
  }

  beginDemo(kind) {
    if (kind === "mix") {
      const flask = this.game.flasks[0];
      if (!flask) {
        this.beginPlay();
        return;
      }
      this._kind = "mix";
      this.stage = "mix";
      this._target = flask;
      this._t = 0;
      this._allow.faucet = true;
      this._allow.platform = true;
      this.overlay.eventMode = "none";
      this.lift(flask.container);
      return;
    }
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
    this.lift(target.container);
  }

  beginPlay() {
    this.drop();
    this.stage = "play";
    this._kind = "play";
    this._target = this.game.hud.playBtn;
    this._t = 0;
    this._allow.faucet = true;
    this._allow.platform = true;
    this.hand.rotation = 0;
    this.hand.visible = true;
    this.arrow.visible = false;
    this.overlay.eventMode = "none";
    this.root.eventMode = "none";
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    if (this.stage === "faucet-demo" || this.stage === "platform-demo") {
      this.stepDemo();
    }
    this.placeHand();
    this.placeArrow();
    this.stepType(dt);
  }

  stepType(dt) {
    if (!this._typing) return;
    const rate = config.tutorial.typeRate;
    this._typeAcc += dt;
    while (this._typeAcc >= rate && this._typeI < this._copy.length) {
      this._typeAcc -= rate;
      this._typeI += 1;
      this.speech.text = this._copy.slice(0, this._typeI);
    }
    if (this._typeI >= this._copy.length) this._typing = false;
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
    if (this.stage === "mix") {
      this.hand.x = p.x + 10;
      this.hand.y = p.y + 16 + Math.sin(this._t * cfg.bobSpeed) * cfg.bobAmp;
      this.hand.rotation = 0;
      return;
    }
    const u = Math.sin((this._t / cfg.demoDuration) * Math.PI);
    const a = cfg.handArc * u;
    this.hand.x = p.x + Math.cos(a) * cfg.handRadius;
    this.hand.y = p.y + Math.sin(a) * cfg.handRadius;
    this.hand.rotation = a - Math.PI / 2;
  }

  placeArrow() {
    const cfg = config.tutorial;
    const obj = this._target;
    const show =
      this.stage !== "play" && this.stage !== "mix" && obj?.container;
    this.arrow.visible = !!show;
    if (!show) return;
    const p = obj.container.position;
    this.arrow.position.set(p.x, p.y + 50);
    const s = 1 + Math.sin(this._t * cfg.arrowSpeed) * cfg.arrowPulse;
    this.arrow.scale.set(this._arrowScale * s);
    this.arrow.scale.y *= -1;
  }
}

function fitWidth(sprite, w) {
  const tw = sprite.texture.width || 1;
  const th = sprite.texture.height || 1;
  sprite.width = w;
  sprite.height = w * (th / tw);
}

function quadIn(t) {
  return t * t;
}

function bounceOut(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}
