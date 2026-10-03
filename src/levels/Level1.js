import { flaskY, Level } from "./Level.js";

const WATER = [70, 200, 255, 255];

// Easy on purpose: the steep board already pours into the jar.
// A nudge either way still lands; the long top board is the waterfall.
export class Level1 extends Level {
  config = {
    coins: 50,
    flasks: [
      {
        x: 8,
        y: flaskY(1),
        type: 1,
        amount: 20,
        targetColor: WATER,
      },
    ],
    faucets: [
      {
        x: 9,
        y: 26.8,
        color: WATER,
        amount: 100,
      },
    ],
    platforms: [
      // { type: "short", x: 9, y: 23, angle: -0.18, rotate: false },
      // { type: "platform", x: 15, y: 14.4, angle: 0.92, rotate: true },
    ],
  };
}
