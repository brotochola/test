import { flaskY, Level } from "./Level.js";

const RED = [255, 48, 48, 255];

export class Level1 extends Level {
  config = {
    coins: 50,
    flasks: [
      {
        x: 9,
        y: flaskY(1),
        type: 1,
        amount: 300,
        targetColor: RED,
      },
    ],
    faucets: [
      {
        x: 5.2,
        y: 26,
        color: RED,
        amount: 520,
      },
    ],
    platforms: [
      {
        type: "short",
        x: 12,
        y: 18,
        angle: 0.45,
        rotate: true,
      },
      {
        type: "platform",
        x: 2,
        y: 16,
        angle: 0.45,
        rotate: true,
      },
    ],
  };
}
