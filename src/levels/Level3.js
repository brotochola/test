import { flaskY, Level } from "./Level.js";

const RED = [255, 45, 40, 255];
const YELLOW = [255, 230, 30, 255];
const CYAN = [0, 210, 190, 255];
const ORANGE = [255, 138, 35, 255];
const GREEN = [128, 220, 110, 255];

const S = 0.85;

// Yellow splits on the flat board. The lower boards start steep enough
// that each mix drops into the near jar; flattening them dumps into the gap.
export class Level3 extends Level {
  config = {
    coins: 100,
    flasks: [
      {
        x: 6.2,
        y: flaskY(1, S),
        type: 1,
        scale: S,
        amount: 70,
        targetColor: ORANGE,
      },
      {
        x: 11.8,
        y: flaskY(1, S),
        type: 1,
        scale: S,
        amount: 70,
        targetColor: GREEN,
      },
    ],
    faucets: [
      {
        x: 2.6,
        y: 26.4,
        color: RED,
        amount: 110,
      },
      {
        x: 9,
        y: 26.6,
        color: YELLOW,
        amount: 220,
      },
      {
        x: 15.4,
        y: 26.4,
        color: CYAN,
        amount: 110,
      },
    ],
    platforms: [
      { type: "short", x: 9, y: 23.6, angle: 0, rotate: false },
      { type: "short", x: 3.3, y: 14.8, angle: -1.28, rotate: true },
      { type: "short", x: 14.7, y: 14.8, angle: 1.28, rotate: true },
    ],
  };
}
