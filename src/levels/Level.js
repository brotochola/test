import { config } from "../config.js";

export class Level {
  config = { flasks: [], faucets: [], boxes: [] };

  enclosure() {
    const ppm = config.world.pixelsPerMeter;
    const w = config.app.width / ppm;
    const h = config.app.height / ppm;
    const color = config.level.wallColor;
    const type = window.liquidfun.b2_staticBody;
    const boxes = enclosureBoxes(w, h, config.level.wallThickness);
    for (let i = 0; i < boxes.length; i++) {
      boxes[i].color = color;
      boxes[i].type = type;
    }
    return boxes;
  }
}

export function enclosureBoxes(w, h, thickness) {
  const half = thickness / 2;
  return [
    { x: w / 2, y: half, width: w, height: thickness },
    { x: w / 2, y: h - half, width: w, height: thickness },
    { x: half, y: h / 2, width: thickness, height: h },
    { x: w - half, y: h / 2, width: thickness, height: h },
  ];
}

function assertEnclosure() {
  const ppm = config.world.pixelsPerMeter;
  const w = config.app.width / ppm;
  const h = config.app.height / ppm;
  const thickness = config.level.wallThickness;
  const [floor, ceiling, left, right] = enclosureBoxes(w, h, thickness);
  const near = (a, b) => Math.abs(a - b) < 1e-6;
  const top = (b) => b.y + b.height / 2;
  const bot = (b) => b.y - b.height / 2;
  const rightEdge = (b) => b.x + b.width / 2;
  const leftEdge = (b) => b.x - b.width / 2;
  if (!near(bot(floor), 0) || !near(top(ceiling), h)) {
    throw new Error("enclosure vertical span");
  }
  if (!near(leftEdge(left), 0) || !near(rightEdge(right), w)) {
    throw new Error("enclosure horizontal span");
  }
  if (!near(top(floor), thickness) || !near(bot(ceiling), h - thickness)) {
    throw new Error("enclosure vertical inset");
  }
  if (!near(rightEdge(left), thickness) || !near(leftEdge(right), w - thickness)) {
    throw new Error("enclosure horizontal inset");
  }
}

assertEnclosure();
