import { config } from "../config.js";

export class Level {
  config = { flasks: [], faucets: [], platforms: [] };

  enclosure() {
    const ppm = config.world.pixelsPerMeter;
    const w = config.app.width / ppm;
    const h = config.app.height / ppm;
    return enclosureBoxes(w, h, config.level.wallThickness);
  }
}

export function flaskY(type = 1, scale = 1) {
  const art = config.flask.types[type];
  const h = config.flask.width * (art.h / art.w) * scale;
  return config.level.wallThickness + h / 2;
}

export function enclosureBoxes(w, h, thickness) {
  const half = thickness / 2;
  return [
    { x: w / 2, y: h - half, width: w, height: thickness },
    { x: half, y: h / 2, width: thickness, height: h },
    { x: w - half, y: h / 2, width: thickness, height: h },
  ];
}
