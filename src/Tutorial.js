import { Container, Sprite } from "./vendor/pixi.min.mjs";
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

    this.root = new Container();
    this.root.zIndex = config.zIndex.tutorial;
    this.root.eventMode = "none";
    this.root.visible = false;

    this.hand = Sprite.from(assetUrl("tutorial_hand.png"));
    this.hand.anchor.set(0.45, 0.08);
    const tw = this.hand.texture.width || 1;
    const th = this.hand.texture.height || 1;
    this.hand.width = config.tutorial.handW;
    this.hand.height = config.tutorial.handW * (th / tw);
    this.root.addChild(this.hand);

    game.app.stage.addChild(this.root);
  }

  start() {
    this.active = true;
    this.root.visible = true;
    this._t = 0;
    this._allow.faucet = false;
    this._allow.platform = false;
    this.beginDemo("faucet");
  }

  end() {
    this.active = false;
    this.stage = null;
    this._target = null;
    this._kind = null;
    this._allow.faucet = true;
    this._allow.platform = true;
    this.root.visible = false;
    this.hand.rotation = 0;
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
    if (this.stage === "faucet" && kind === "faucet") this.beginDemo("platform");
    else if (this.stage === "platform" && kind === "platform") this.beginPlay();
  }

  beginDemo(kind) {
    const target =
      kind === "faucet"
        ? this.game.faucets[0]
        : this.game.platforms.find((p) => p._rotate);
    if (!target) {
      if (kind === "faucet") this.beginDemo("platform");
      else this.beginPlay();
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
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    if (this.stage === "faucet-demo" || this.stage === "platform-demo") {
      this.stepDemo();
    }
    this.placeHand();
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
      this.hand.y =
        btn.y + 16 + Math.sin(this._t * cfg.bobSpeed) * cfg.bobAmp;
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
}
