# Two Minutes, Bhavya

A birthday site in React (Vite).

```bash
npm install
npm run dev      # live preview at http://localhost:5173
npm run build    # writes the shareable single file: ../bhavya.html
```

- `src/data.js`: the personal words (your name, the letter, reel memories, universes)
- `src/components/`: one file per section (Kitchen, Recipe, Story, Catcher, Multiverse, Wish, Packet, Ending)
- `src/engine/kitchen.js`: the cooking animation (stove, jug, cracking noodle cake, masala, spoon, noodles spelling her name)
- `src/engine/catcher.js`: the Catch the Reels game
- `src/lib/`: sound, confetti and small helpers

Open the site with `#debug` at the end of the URL to expose `window.__kitchen` for testing animations.
