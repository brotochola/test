import { Container, Sprite, Text, Texture } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";
import { bounceTap, tween } from "./ui.js";

const PILL_W = 260;
const BTN = 72;
const BTN_SCALE = 0.5;
const MUTE_W = 48;
const COIN_SIZE = 64;

export class Hud {
  constructor(game) {
    this.game = game;
    this.root = new Container();
    this.root.zIndex = config.zIndex.hud;

    const pill = Sprite.from(assetUrl("coin_indicator.png"));
    pill.anchor.set(0, 0);
    const tw = pill.texture.width || 1;
    const th = pill.texture.height || 1;
    pill.width = PILL_W;
    pill.height = PILL_W * (th / tw);
    pill.position.set(12, 10);
    pill.eventMode = "none";
    this.pill = pill;
    this.coinDest = {
      x: pill.x + pill.height * 0.5,
      y: pill.y + pill.height * 0.5,
    };
    this.root.addChild(pill);

    this.coins = new Text({
      text: "0",
      style: {
        fill: config.ui.ink,
        fontSize: 28,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
      },
    });
    this.coins.anchor.set(1, 0.5);
    this.coins.position.set(230, 84);
    this.coins.eventMode = "none";
    this.root.addChild(this.coins);

    this.level = new Text({
      text: "Level 1",
      style: {
        fill: config.ui.cream,
        fontSize: 22,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
      },
    });
    this.level.anchor.set(0.5);
    this.level.position.set(360, 10 + BTN / 2);
    this.level.eventMode = "none";
    this.root.addChild(this.level);

    const btnY = pill.y + pill.height / 2;
    this.playBtn = Sprite.from(assetUrl("play.png"));
    this.playBtn.anchor.set(0.5);
    this.playBtn.position.set(650, btnY);
    this.playBtn.scale.set(BTN_SCALE);
    this.playBtn.eventMode = "static";
    this.playBtn.cursor = "pointer";
    this.playBtn.on("pointertap", () => {
      if (game.mode === "play" || game.paused) return;
      if (game.tutorial?.blockingPlay()) return;
      bounceTap(game, this.playBtn, () => game.play(), BTN_SCALE);
    });
    this.root.addChild(this.playBtn);

    this.restartBtn = Sprite.from(assetUrl("restart.png"));
    this.restartBtn.anchor.set(0.5);
    this.restartBtn.position.set(650, btnY);
    this.restartBtn.scale.set(BTN_SCALE);
    this.restartBtn.eventMode = "static";
    this.restartBtn.cursor = "pointer";
    this.restartBtn.visible = false;
    this.restartBtn.on("pointertap", () => {
      bounceTap(game, this.restartBtn, () => game.restartLevel(), BTN_SCALE);
    });
    this.root.addChild(this.restartBtn);

    this.muteOn = Texture.from(assetUrl("unmute.png"));
    this.muteOff = Texture.from(assetUrl("mute.png"));
    this.muteBtn = Sprite.from(this.muteOn);
    this.muteBtn.anchor.set(0.5);
    const mw = this.muteBtn.texture.width || 1;
    const mh = this.muteBtn.texture.height || 1;
    this.muteBtn.width = MUTE_W;
    this.muteBtn.height = MUTE_W * (mh / mw);
    this.muteScale = this.muteBtn.scale.x;
    this.muteBtn.position.set(650, btnY + 80);
    this.muteBtn.eventMode = "static";
    this.muteBtn.cursor = "pointer";
    this.muteBtn.on("pointertap", () => {
      const mute = !game.sound.muted;
      if (game.sound.muted) {
        game.sound.setMuted(false);
        this.syncMute();
      }
      bounceTap(
        game,
        this.muteBtn,
        () => {
          if (mute) game.sound.setMuted(true);
          this.syncMute();
        },
        this.muteScale,
      );
    });
    this.root.addChild(this.muteBtn);

    game.app.stage.addChild(this.root);
  }

  syncMute() {
    this.muteBtn.texture = this.game.sound.muted ? this.muteOff : this.muteOn;
    this.muteBtn.scale.set(this.muteScale);
  }

  setPlaying(on) {
    this.playBtn.visible = !on;
    this.restartBtn.visible = on;
  }

  setPlayEnabled(on) {
    this.playBtn.alpha = on ? 1 : 0.45;
  }

  setCoins(n) {
    this.coins.text = String(n);
  }

  flyCoin(x, y) {
    const coin = Sprite.from(assetUrl("coin.png"));
    coin.anchor.set(0.5);
    const s0 = COIN_SIZE / (coin.texture.width || 1);
    coin.scale.set(s0);
    coin.position.set(x, y);
    coin.eventMode = "none";
    this.root.addChild(coin);

    const { x: dx, y: dy } = this.coinDest;
    const cx = (x + dx) / 2 + (x > dx ? 70 : -70);
    const cy = dy + (y - dy) * 0.35;
    tween(this.game.app, {
      duration: 0.55,
      ease: (u) => 1 - (1 - u) * (1 - u),
      onUpdate: (u) => {
        const o = 1 - u;
        coin.x = o * o * x + 2 * o * u * cx + u * u * dx;
        coin.y = o * o * y + 2 * o * u * cy + u * u * dy;
        coin.scale.set(s0 * (1 - 0.4 * u));
      },
      onDone: () => coin.destroy(),
    });
  }

  setLevel(i) {
    this.level.text = `Level ${i}`;
  }
}
