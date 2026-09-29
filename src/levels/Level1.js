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
        amount: 0,
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
    boxes: [
      {
        src: "platform.png",
        x: 9,
        y: 16,
        width: 6,
        height: 1.5,
        angle: 0.45,
        rotate: true,
      },
    ],
  };
}
