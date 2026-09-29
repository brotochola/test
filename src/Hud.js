import { Container, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

export class Hud {
  constructor(game) {
    this.root = new Container();
    this.root.zIndex = config.zIndex.hud;
    this.root.eventMode = "passive";

    const coin = Sprite.from(assetUrl("coin.png"));
    coin.anchor.set(0, 0.5);
    coin.position.set(16, 40);
    coin.width = 48;
    coin.height = 48;
    this.root.addChild(coin);

    this.coins = new Text({
      text: "0",
      style: {
        fill: config.ui.cream,
        fontSize: 28,
        fontFamily: config.ui.fontFamily,
        fontWeight: "600",
      },
    });
    this.coins.anchor.set(0, 0.5);
    this.coins.position.set(72, 40);
    this.root.addChild(this.coins);

    const chip = Sprite.from(assetUrl("hud-chip.png"));
    chip.anchor.set(0.5);
    chip.position.set(360, 40);
    chip.width = 180;
    chip.height = 48;
    this.root.addChild(chip);

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
    this.level.position.set(360, 40);
    this.root.addChild(this.level);

    const restart = Sprite.from(assetUrl("btn-restart.png"));
    restart.anchor.set(1, 0.5);
    restart.position.set(704, 40);
    restart.width = 56;
    restart.height = 56;
    restart.eventMode = "static";
    restart.cursor = "pointer";
    restart.on("pointertap", () => game.restartLevel());
    this.root.addChild(restart);

    game.app.stage.addChild(this.root);
  }

  setCoins(n) {
    this.coins.text = String(n);
  }

  setLevel(i) {
    this.level.text = `Level ${i}`;
  }
}
