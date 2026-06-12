# Lake Economy Prototype

A blank-slate static MVP for the Impact Frontier / Shifting the Frontier homepage game.

## What is included

- Full-window isometric lake economy visual using Canvas 2D, with pseudo-3D buildings, lake, routes, other investors, offer tokens, and capital-response signals.
- Step 1 goal overlay: Lake health, Local prosperity, or blended slider.
- Step 2 offer overlay: six investable entities, visible business payoff/risk/lake/prosperity statistics, 100-token offer budget, presets, deterministic Run economy action.
- Step 3 results overlay: offers versus actual capital added, lake/prosperity effects, risk-adjusted return, approximate playable Impact Frontier chart.
- Top Research button that opens a large overlay panel above the game with placeholders for paper HTML, screenshots, links, and guide content.
- No backend, no database, no package install, no external JS dependencies.

## How to run locally

From this folder:

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

A static server is recommended because the prototype uses ES modules. Opening `index.html` directly from the file system may work in some browsers but is not reliable.

## File structure

```text
lake-economy-prototype/
  index.html
  styles.css
  src/
    app.js        # UI state, overlays, event handlers
    economy.js    # deterministic economic engine and frontier solver
    scene.js      # Canvas isometric lake world rendering
    chart.js      # SVG Impact Frontier chart
```

## Model notes

The prototype implements the documented MVP flow:

```text
b_n >= 0
sum_n b_n = 100
Delta phi = alpha * b
Delta K = C * Delta phi
Delta X = g' Delta K
```

The hidden response matrix `C` is scenario-template based. Four templates are included:

1. Feed bottleneck
2. Market access bottleneck
3. Scalable entrepreneur
4. Dirty growth trap

The frontier is an approximate grid search over feasible 100-token offer vectors. The visible chart uses expected outcome change on the x-axis and risk-adjusted return on the y-axis.

## Integration notes

For a React / Next integration, keep the same split:

- port `src/economy.js` into a TypeScript model module,
- port `src/chart.js` into a component,
- either keep `src/scene.js` as a Canvas component or replace it with Three.js / React Three Fiber,
- keep the Research panel as a top-level overlay so research HTML can sit above the game.

## Known prototype limitations

- The R model file referenced in the Markdown context was not present in the uploaded project files, so this engine follows the documented model equations and parameter guidance rather than a direct line-by-line R port.
- The scene is Canvas pseudo-3D rather than Three.js. It is dependency-free and fast, but it is not a true 3D camera/mesh scene.
- Frontier scoring uses an approximate grid search with 10-token increments. It is stable for MVP play, but not production numerical optimization.
- Hidden response matrices are hand-tuned scenario templates, not calibrated data.
- Paper links and screenshots are placeholders in the Research panel.
