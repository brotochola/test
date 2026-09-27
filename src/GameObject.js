import { Container } from "./vendor/pixi.min.mjs";

export class GameObject {
  constructor(game, body, view) {
    this.game = game;
    this.body = body;
    this.view = view;
    this.container = new Container();
    game.mainContainer.addChild(this.container);
    game.objects.push(this);
    this.update();
  }

  update() {
    const p = this.body.GetPosition();
    const s = this.game.toScreen(p.x, p.y);
    this.container.position.set(s.x, s.y);
    this.container.rotation = -this.body.GetAngle();
  }
}
