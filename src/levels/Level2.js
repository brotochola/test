import { flaskY, Level } from "./Level.js";

const GREEN_LIQUID = [0, 255, 0, 255];

// Easy on purpose: the steep board already pours into the jar.
// A nudge either way still lands; the long top board is the waterfall.
export class Level2 extends Level {
  config = {
    coins: 50,
    flasks: [
      {
        x: 4,
        y: flaskY(1),
        type: 1,
        amount: 20,
        targetColor: GREEN_LIQUID,
      },
    ],
    faucets: [
      {
        x: 9,
        y: 26.8,
        color: GREEN_LIQUID,
        amount: 100,
      },
    ],
    platforms: [
      // { type: "short", x: 9, y: 23, angle: -0.18, rotate: false },
      { type: "short", x: 9, y: 22, angle: 0.92, rotate: true },
    ],
  };
}
