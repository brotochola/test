import { flaskY, Level } from "./Level.js";

const RED = [255, 48, 48, 255];
const BLUE = [40, 90, 255, 255];
const PURPLE = [148, 69, 152, 255];

export class Level2 extends Level {
  config = {
    coins: 75,
    flasks: [
      {
        x: 9,
        y: flaskY(1),
        type: 1,
        amount: 0,
        targetColor: PURPLE,
      },
    ],
    faucets: [
      {
        x: 4.8,
        y: 26,
        color: RED,
        amount: 420,
      },
      {
        x: 13.2,
        y: 26,
        color: BLUE,
        amount: 420,
      },
    ],
    boxes: [
      {
        src: "platform-short.png",
        x: 6,
        y: 18,
        width: 4,
        height: 2,
        angle: -0.35,
        rotate: true,
      },
      {
        src: "platform-short.png",
        x: 12,
        y: 18,
        width: 4,
        height: 2,
        angle: 0.35,
        rotate: true,
      },
    ],
  };
}
