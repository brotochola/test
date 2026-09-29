import { Container, Rectangle, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

const PILL_W = 260;
const BTN = 72;

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
    this.playBtn.scale.set(0.33);
    this.playBtn.eventMode = "static";
    this.playBtn.cursor = "pointer";
    this.playBtn.on("pointertap", () => game.play());
    this.root.addChild(this.playBtn);

    this.restartBtn = Sprite.from(assetUrl("restart.png"));
    this.restartBtn.anchor.set(0.5);
    this.restartBtn.position.set(650, btnY);
    this.restartBtn.scale.set(0.33);
    this.restartBtn.eventMode = "static";
    this.restartBtn.cursor = "pointer";
    this.restartBtn.visible = false;
    this.restartBtn.on("pointertap", () => {
      game.click();
      game.restartLevel();
    });
    this.root.addChild(this.restartBtn);

    this.muteBtn = new Text({
      text: "Mute",
      style: {
        fill: config.ui.cream,
        fontSize: 22,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
      },
    });
    this.muteBtn.anchor.set(1, 0.5);
    this.muteBtn.position.set(this.playBtn.x - 70, btnY);
    this.muteBtn.eventMode = "static";
    this.muteBtn.cursor = "pointer";
    this.muteBtn.hitArea = new Rectangle(-88, -28, 96, 56);
    this.muteBtn.on("pointertap", () => {
      const on = !game.sound.muted;
      if (on) game.click();
      game.sound.setMuted(on);
      if (!on) game.click();
      this.muteBtn.text = on ? "Muted" : "Mute";
    });
    this.root.addChild(this.muteBtn);

    game.app.stage.addChild(this.root);
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

  setLevel(i) {
    this.level.text = `Level ${i}`;
  }
}
