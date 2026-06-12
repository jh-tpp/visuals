# Lake Economy Prototype v2

A standalone second-iteration MVP for the Lake Economy homepage game.

## What changed from the first iteration

- The economy is now a real Three.js scene rather than a pseudo-3D canvas.
- The lake/town remains visible while the player interacts with the game.
- There are no full-screen step modals and no gray/dark blur over the economy.
- The gameplay controls live in a compact left panel inspired by the Harbor Town reference, but smaller and more research-homepage oriented.
- The top strip has permanent **Papers**, **Guides**, and **Methods** buttons. These open a research panel over the scene without hiding the game behind a modal mask.
- The economic engine has been ported from `lake_economy_model_prototype.R`: offer shares shift player supply, aggregate supply and demand clear in levels, and metrics/frontier scores are computed relative to equal offers.
- The Impact Frontier chart uses the requested convention: expected outcome change on the x-axis and risk-adjusted return on the y-axis.

## Run locally

```bash
cd lake-economy-prototype-v2
python3 -m http.server 8080
```

Open:

```text
http://localhost:8080
```

The scene uses Three.js and OrbitControls from a CDN via an import map, so the browser needs to be online the first time it loads those modules. This matches the reference prototype’s approach. If you want this fully offline, replace the import-map URLs in `index.html` with locally vendored Three.js files.

## Files

```text
lake-economy-prototype-v2/
  index.html
  styles.css
  README.md
  src/
    app.js        # UI state, panels, game flow, scoring calls
    chart.js      # SVG Impact Frontier chart
    economy.js    # R-model-inspired market-clearing engine
    scene.js      # Three.js lake economy scene and labels
```

## Interaction loop

1. Choose the goal: lake health, balanced, or local prosperity.
2. Allocate exactly 100 offer tokens across six investable entities.
3. Run the economy.
4. Compare your offers with actual capital added after market clearing.
5. Use the frontier chart and score to adjust and run again.
6. Use **Start fresh** to keep the same lake but clear offers, or **New lake** to generate a different scenario template.

## Model notes

`src/economy.js` ports the R prototype’s main structure:

- `b_share` is the player’s offer share vector.
- `s_player(b)` is the offer-generated supply shift.
- `K(b)` is solved from the level-clearing equation.
- `P(b)`, `K_player`, and `K_other` are derived from the cleared economy.
- Lake health, prosperity, blended outcome, payoff, risk penalty, and certainty-equivalent value are computed after clearing.
- The frontier grid combines presets, a coarse simplex grid, and seeded random simplex samples.

The four scenario templates are light perturbations around the R prototype values:

- Feed bottleneck
- Market access bottleneck
- Scalable entrepreneur
- Dirty growth trap

The templates are intentionally conservative. They change parameters enough to make lakes feel different while keeping the R model’s structure legible.

## Research panel slots

The **Papers** and **Guides** panels contain placeholder blocks for screenshots, paper cards, PDF embeds, abstracts, download links, or existing HTML. Replace the contents of `contentForMode()` in `src/app.js` with your production research markup.

## Known limitations

- This is a static prototype, not a React/Next implementation.
- Three.js is loaded from a CDN.
- I could syntax-check the modules and test the pure economic engine in Node, but a headless browser was not available in this container because the Playwright browser binary is not installed.
- The model is still a stylized toy economy. The scenario templates are hand-tuned, not calibrated to real data.
- The frontier is approximate. It combines a coarse feasible grid and random simplex samples, so it is stable and fast but not a formal optimizer.
- The 3D scene uses simple geometry, not imported art assets. It should be easier to maintain, but it is not a high-fidelity city model.
