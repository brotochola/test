# Project note

Potion-pour playable for Scrambly. Aim faucets and tilt boards so the mix lands in the flasks. Completing levels awards demo rewards (not real earnings). The last screen invites the player to explore Scrambly.

## What I used

- PixiJS 8.21 (vendored, MIT) for rendering and input
- liquidfun-emscripten 1.1.4 (vendored) for the particle liquid
- Fredoka SemiBold (local TTF)
- Scrambly fox and palette from the brief
- Game art generated in ChatGPT from `docs/art-prompts.md`
- Kenney UI / Impact Sounds for clicks, win/lose, faucet loop
- Cursor for implementation
- [https://freesound.org/people/wichogarcia/sounds/146762/](https://freesound.org/people/wichogarcia/sounds/146762/)
- [https://freesound.org/people/Fupicat/sounds/521640/](https://freesound.org/people/Fupicat/sounds/521640/)

No backend and no CDNs at runtime. Static HTTP only.

## Run

See [README.md](README.md). Must be served over HTTP.

## Tested

Fill in before submit. Mark real vs emulated.

| Target                                       | Result |
| -------------------------------------------- | ------ |
| Chrome desktop (wide window)                 | x      |
| Portrait 320 × 568                           | x      |
| Portrait 390 × 844                           | x      |
| Phone landscape (rotate prompt)              | x      |
| Tab hide / show mid-pour                     | x      |
| Mute + audio after first tap                 | x      |
| CTA click (confirm + console, no navigation) | x      |
| Restart mid-pour and Play again              | x      |

## Known limitations

- More levels! I loved to build this game.
- Portrait-only on coarse pointers (phones/tablets). Landscape shows a text rotate prompt and pauses the sim. Desktop wide windows letterbox; that is intended.
- Rewards on the result card are a demo score, labeled **demo rewards**. Not a wallet and not real earnings.
- Restart mid-level keeps board/faucet angles (on purpose). Play again after the finale stays on level 3; refresh to start over.
