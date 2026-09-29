import { Container, Graphics, Sprite, Text } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";
import { assetUrl } from "./assets.js";

export class Dialog {
  constructor(game) {
    this.game = game;
    this.root = new Container();
    this.root.zIndex = config.zIndex.dialog;
    this.root.visible = false;
    this.root.eventMode = "static";
    this._last = false;

    const dim = new Graphics()
      .rect(0, 0, config.app.width, config.app.height)
      .fill({ color: config.ui.dim, alpha: 0.72 });
    dim.eventMode = "static";
    this.root.addChild(dim);

    const panel = Sprite.from(assetUrl("panel.png"));
    panel.anchor.set(0.5);
    panel.position.set(360, 640);
    panel.width = 560;
    panel.height = 820;
    this.root.addChild(panel);

    this.foxHappy = Sprite.from(assetUrl("fox-happy.png"));
    this.foxHappy.anchor.set(0.5);
    this.foxHappy.position.set(360, 360);
    this.foxHappy.width = 200;
    this.foxHappy.height = 200;
    this.root.addChild(this.foxHappy);

    this.foxCta = Sprite.from(assetUrl("fox-cta.png"));
    this.foxCta.anchor.set(0.5);
    this.foxCta.position.set(360, 360);
    this.foxCta.width = 200;
    this.foxCta.height = 200;
    this.foxCta.visible = false;
    this.root.addChild(this.foxCta);

    this.title = label("Nice mix!", 500, config.ui.titleSize, config.ui.ink);
    this.earned = label("", 560, config.ui.fontSize, config.ui.orange);
    this.total = label("", 610, config.ui.fontSize, config.ui.ink);
    this.root.addChild(this.title, this.earned, this.total);

    this.again = labeledButton(
      "btn-secondary.png",
      "Play again",
      720,
      config.ui.ink,
      () => game.restartLevel(),
    );
    this.next = labeledButton(
      "btn-primary.png",
      "Next",
      830,
      config.ui.cream,
      () => this.onNext(),
    );
    this.root.addChild(this.again.root, this.next.root);

    this.ctaNote = label("CTA clicked — demo only", 940, 22, config.ui.purple);
    this.ctaNote.visible = false;
    this.root.addChild(this.ctaNote);

    game.app.stage.addChild(this.root);
  }

  onNext() {
    if (this._last) {
      console.log("CTA clicked — demo only");
      this.ctaNote.visible = true;
      return;
    }
    this.game.nextLevel();
  }

  show({ earned, total, last }) {
    this._last = last;
    this.root.visible = true;
    this.ctaNote.visible = false;
    this.foxHappy.visible = !last;
    this.foxCta.visible = last;
    this.title.text = last ? "Rewards unlocked" : "Nice mix!";
    this.earned.text = earned > 0 ? `+${earned} coins` : "Already collected";
    this.total.text = `${total} coins so far`;
    this.next.text.text = last ? "Explore Scrambly" : "Next";
  }

  hide() {
    this.root.visible = false;
  }
}

function label(text, y, fontSize, fill) {
  const t = new Text({
    text,
    style: {
      fill,
      fontSize,
      fontFamily: "sans-serif",
      fontWeight: "700",
      align: "center",
    },
  });
  t.anchor.set(0.5);
  t.position.set(360, y);
  return t;
}

function labeledButton(src, caption, y, fill, onTap) {
  const root = new Container();
  root.position.set(360, y);
  root.eventMode = "static";
  root.cursor = "pointer";
  const bg = Sprite.from(assetUrl(src));
  bg.anchor.set(0.5);
  bg.width = 400;
  bg.height = 88;
  const text = new Text({
    text: caption,
    style: {
      fill,
      fontSize: config.ui.fontSize,
      fontFamily: "sans-serif",
      fontWeight: "700",
    },
  });
  text.anchor.set(0.5);
  root.addChild(bg, text);
  root.on("pointertap", onTap);
  return { root, text, bg };
}
