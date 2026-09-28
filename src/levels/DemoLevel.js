import { Level } from "./Level.js";

export class DemoLevel extends Level {
  config = {
    flasks: [{ x: 9, y: 3.8, amount: 1 }],
    faucets: [
      {
        x: 7.6,
        y: 12.2,
        color: [255, 48, 48, 255],
        fill: 0xcc3333,
        vx: 1.6,
        vy: -6,
      },
      {
        x: 10.4,
        y: 12.2,
        color: [40, 90, 255, 255],
        fill: 0x3366dd,
        vx: -1.6,
        vy: -6,
      },
    ],
    boxes: [
      {
        x: 3.2,
        y: 2.4,
        width: 2.2,
        height: 2.2,
        color: 0xc4783a,
        angle: 0.28,
      },
    ],
  };
}
