export class GameObject {
  constructor(game, body, view) {
    this.game = game;
    this.body = body;
    this.view = view;
    game.mainContainer.addChild(view);
    game.objects.push(this);
    this.update();
  }

  update() {
    const p = this.body.GetPosition();
    const s = this.game.toScreen(p.x, p.y);
    this.view.position.set(s.x, s.y);
    this.view.rotation = -this.body.GetAngle();
  }
}
