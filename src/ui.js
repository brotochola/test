export function tween(app, { duration, delay = 0, ease, onUpdate, onDone }) {
  let t = 0;
  let done = false;
  const tick = (ticker) => {
    if (done) return;
    t += ticker.deltaMS / 1000;
    if (t < delay) return;
    const u = Math.min(1, (t - delay) / duration);
    onUpdate(ease ? ease(u) : u);
    if (u >= 1) {
      done = true;
      app.ticker.remove(tick);
      onDone?.();
    }
  };
  app.ticker.add(tick);
  return () => {
    if (done) return;
    done = true;
    app.ticker.remove(tick);
  };
}

export function bounceTap(game, node, fn, baseScale = 1) {
  game.click();
  return tween(game.app, {
    duration: 0.28,
    onUpdate: (u) => {
      const s =
        u < 0.5 ? 1 + 0.08 * (u / 0.5) : 1.08 - 0.08 * ((u - 0.5) / 0.5);
      node.scale.set(s * baseScale);
    },
    onDone: fn,
  });
}
