# October 3, 2026

Potion Mix went from a three-level pour into a four-level run with a splash screen, a fox coach, steel platforms, and tighter coin scoring.

## Levels

The run is now four levels, taught one idea at a time.

- **Level 1** is a single water faucet and one flask that needs 20. The boards are gone so the first thing you learn is aiming the faucet.
- **Level 2** is the same shape in green, with one plank you can rotate.
- **Level 3** mixes red and blue into a purple flask. Two boards start tipped outward; turning them inward is how the colors meet.
- **Level 4** splits a yellow pour across a fixed top board. Red and green on the sides mix into an orange flask and a green flask. The lower boards start steep so each mix drops into the near jar.

The old settle delay before a level could resolve is gone. A flask passes when it has enough particles and the mixed color is close enough to the label.

## Coins

A flask pays one coin per particle, and never more than the amount written on it. Extra liquid in the jar does not add coins. The HUD total updates as the pour lands. Winning a level banks that pour once; playing it again does not add the same coins a second time.

On the result card, a win shows the payout as `+20 (demo rewards)` on one line. The “already collected” line is gone. A loss uses a taller title and a higher button so the panel does not look empty.

## Fixed platforms

Planks that cannot be rotated now use the steel sprites (`fixed-platform.png`, `short-fixed-platform.png`) instead of the wooden ones. Width comes from the image aspect ratio. The physics box for a fixed plank is half as thick as the sprite, so the liquid sits on the visible lip.

## Splash and tutorial

The game opens on `splash-screen.jpg` (high-quality JPEG). Play on the HUD stays off until that screen is dismissed.

Before the first three levels, the lab fox (`fox-guide.png`) and a speech bubble explain the move:

- Level 1: rotate the faucet to aim.
- Level 2: rotate planks to guide the liquid.
- Level 3: pour both colors into the flask to match the label.

The fox and bubble pop in, the line types out, and they leave with a small squash then a slide off to the right. Touching or pressing the faucet on level 1 dismisses the coach, the bubble, and the dim immediately. The pointing hand on Play does not lock aiming. On the mix step both the faucets and the planks stay rotatable, and the flask sits above the dim with no box drawn around it.

## Art size

The new images were scaled to the size the game actually draws and recompressed: fox guide, speech bubble, both steel platforms, and the rotate arrow. The splash is a JPEG instead of a large PNG.
