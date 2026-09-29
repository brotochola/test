import { Container, Graphics, Sprite } from "./vendor/pixi.min.mjs";
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
    this._handBase = { x: 0, y: 0 };
    this._allow = { faucet: false, platform: false };

    this.root = new Container();
    this.root.zIndex = config.zIndex.tutorial;
    this.root.eventMode = "none";
    this.root.visible = false;

    this.stroke = new Graphics();
    this.root.addChild(this.stroke);

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
    this.game.hud.setPlayEnabled(false);
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
    this.stroke.clear();
    this.hand.rotation = 0;
    this.game.hud.setPlayEnabled(true);
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
    this.game.hud.setPlayEnabled(false);
  }

  beginPlay() {
    this.stage = "play";
    this._kind = "play";
    this._target = this.game.hud.playBtn;
    this._t = 0;
    this._allow.faucet = true;
    this._allow.platform = true;
    this.hand.rotation = 0;
    this.game.hud.setPlayEnabled(true);
  }

  update(dt) {
    if (!this.active) return;
    this._t += dt;
    if (this.stage === "faucet-demo" || this.stage === "platform-demo") {
      this.stepDemo();
    }
    this.followTarget();
    this.drawStroke();
    const cfg = config.tutorial;
    this.hand.x = this._handBase.x;
    this.hand.y =
      this._handBase.y + Math.sin(this._t * cfg.bobSpeed) * cfg.bobAmp;
    const demo = this.stage === "faucet-demo" || this.stage === "platform-demo";
    this.hand.rotation = demo ? Math.sin(this._t * 3) * 0.28 : 0;
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

  followTarget() {
    if (this.stage === "play") {
      const btn = this.game.hud.playBtn;
      this.stroke.position.set(btn.x, btn.y);
      this._handBase.x = btn.x + 10;
      this._handBase.y = btn.y + 16;
      return;
    }
    const obj = this._target;
    if (!obj?.container) return;
    const p = obj.container.position;
    this.stroke.position.set(p.x, p.y);
    this._handBase.x = p.x + 18;
    this._handBase.y = p.y + 22;
  }

  drawStroke() {
    const g = this.stroke;
    g.clear();
    const pulse = 0.55 + 0.45 * Math.sin(this._t * 4);
    const pad = config.tutorial.pad;
    let rx;
    let ry;
    if (this.stage === "play") {
      rx = ry = this.game.hud.playBtn.width / 2 + pad;
    } else if (this._target?.container?.hitArea) {
      const hit = this._target.container.hitArea;
      rx = hit.width / 2;
      ry = hit.height / 2;
    } else if (this._target?.view) {
      rx = this._target.view.width / 2 + pad;
      ry = this._target.view.height / 2 + pad;
    } else {
      return;
    }
    g.ellipse(0, 0, rx, ry);
    g.stroke({
      width: config.tutorial.strokeWidth,
      color: config.ui.purple,
      alpha: pulse,
    });
  }
}
