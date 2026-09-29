import { flaskY, Level } from "./Level.js";

const RED = [255, 45, 40, 255];
const BLUE = [45, 70, 255, 255];
const PURPLE = [150, 58, 148, 255];

// Boards start tipped outward. Turn both inward so the colors meet in the jar.
export class Level2 extends Level {
  config = {
    coins: 75,
    flasks: [
      {
        x: 4.45,
        y: flaskY(1),
        type: 1,
        amount: 140,
        targetColor: PURPLE,
      },
    ],
    faucets: [
      {
        x: 4.3,
        y: 26.6,
        color: RED,
        amount: 260,
      },
      {
        x: 15.7,
        y: 26.6,
        color: BLUE,
        amount: 260,
      },
    ],
    platforms: [
      { type: "short", x: 5.5, y: 21.6, angle: 0.42, rotate: true },
      { type: "short", x: 14.3, y: 21.6, angle: -0.38, rotate: true },
      { type: "platform", x: 11.1, y: 14.2, angle: 0.78, rotate: false },
    ],
  };
}
