import { Assets } from "./vendor/pixi.min.mjs";

export const ASSET_FILES = [
  "bg.jpg",
  "flask1_front.png",
  "flask1_back.png",
  "faucet.png",
  "platform.png",
  "short_platform.png",
  "label.png",
  "bubble.png",
  "coin_indicator.png",
  "play.png",
  "restart.png",
  "tutorial_hand.png",
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
  await Promise.allSettled(
    ASSET_FILES.map((file) => Assets.load(assetUrl(file))),
  );
}

export async function loadFont() {
  const face = new FontFace(
    "Fredoka",
    `url(${assetUrl("Fredoka-SemiBold.ttf")})`,
    { weight: "600" },
  );
  await face.load();
  document.fonts.add(face);
}
