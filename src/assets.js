import { Assets } from "./vendor/pixi.min.mjs";

export const ASSET_FILES = [
  "bg.png",
  "flask1.png",
  "flask2.png",
  "faucet.png",
  "pivot.png",
  "platform.png",
  "platform-short.png",
  "floor.png",
  "roof.png",
  "wall.png",
  "coin.png",
  "hud-chip.png",
  "btn-restart.png",
  "panel.png",
  "btn-primary.png",
  "btn-secondary.png",
  "fox-happy.png",
  "fox-cta.png",
];

export function assetUrl(file) {
  return new URL(`./assets/${file}`, import.meta.url).href;
}

export async function preloadAssets() {
  await Promise.allSettled(ASSET_FILES.map((file) => Assets.load(assetUrl(file))));
}
