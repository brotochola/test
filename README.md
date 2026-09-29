# Scrambly playable

Portrait pour-and-mix puzzle. Aim faucets, tilt boards, fill the flasks. Completing levels awards **demo rewards**. The last screen invites the player to explore Scrambly (click is simulated).

## Run

Serve the folder that contains `index.html`. Opening as `file://` will fail (ES modules + audio `fetch`).

```bash
npx --yes serve -p 8080 .
```

or

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## Controls

- Drag a faucet to aim, drag a colored board to tilt (gray boards are fixed)
- Play starts the pour; restart during a pour, or Play again on the result card
- Mute is on the HUD
- After level 3, **Explore Scrambly** logs `CTA clicked — demo only` and does not navigate
- Phones in landscape show a rotate prompt; desktop windows letterbox as-is

Process, credits, testing, and limitations: [NOTES.md](NOTES.md)
