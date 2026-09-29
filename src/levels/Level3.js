import { flaskY, Level } from "./Level.js";

const RED = [255, 48, 48, 255];
const BLUE = [40, 90, 255, 255];

export class Level3 extends Level {
  config = {
    coins: 100,
    flasks: [
      {
        x: 5.2,
        y: flaskY(1, 0.8),
        type: 1,
        scale: 0.8,
        amount: 0,
        targetColor: RED,
      },
      {
        x: 12.8,
        y: flaskY(1, 0.8),
        type: 1,
        scale: 0.8,
        amount: 0,
        targetColor: BLUE,
      },
    ],
    faucets: [
      {
        x: 14,
        y: 26,
        color: RED,
        amount: 460,
      },
      {
        x: 4,
        y: 26,
        color: BLUE,
        amount: 460,
      },
    ],
    platforms: [
      {
        type: "short",
        x: 6.5,
        y: 19,
        angle: 0.7,
        rotate: true,
      },
      {
        type: "short",
        x: 11.5,
        y: 19,
        angle: -0.7,
        rotate: true,
      },
    ],
  };
}
