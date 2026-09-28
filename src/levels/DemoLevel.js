import { config } from "../config.js";
import { Level } from "./Level.js";

const jar = config.flask.types[1];
const jarHeight = config.flask.width * (jar.h / jar.w);

export class DemoLevel extends Level {
  config = {
    flasks: [
      {
        x: 9,
        y: config.level.wallThickness + jarHeight / 2,
        type: 1,
        amount: 1,
      },
    ],
    faucets: [
      {
        x: 7.6,
        y: 12.2,
        color: [255, 48, 48, 255],
        fill: 0xcc3333,
        vx: 0,
        vy: 10,
        amount: 240,
      },
      // {
      //   x: 10.4,
      //   y: 12.2,
      //   color: [40, 90, 255, 255],
      //   fill: 0x3366dd,
      //   vx: 10,
      //   vy: 0,
      //   amount: 240,
      // },
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
