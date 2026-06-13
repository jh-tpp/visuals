# The Impact Frontier — Harbor Economy Prototype v3

This is the third standalone MVP iteration for the interactive homepage demo.

It keeps the R-model-aligned market-clearing engine from v2 and changes the presentation to a cleaner harbor-front research-site prototype:

- white research navigation bar with placeholder TPP / CSP / HSG logo chips,
- page identity as **The Impact Frontier** rather than “Lake Economy,”
- permanent **Papers**, **Guides**, and **Methods** panels,
- a white **Play** button in the upper-left area,
- compact left-side game controls that do not gray out or blur the 3D economy,
- a fixed present-day harbor layout rather than a lake-in-the-center layout,
- non-trivial shoreline and gently rising, undulating terrain adapted from the Harbor Town reference,
- boats in the same simple low-poly style as the Harbor Town boats, with several hull colors,
- six investable entities laid out along one waterfront:
  - Scalable fish farm,
  - Steady fish farm,
  - Feed mill,
  - Hatchery,
  - Cold chain,
  - Lakefront industry,
- entity popups that appear near the selected entity and close when clicking outside,
- offer numbers and yellow offer-fill bars above each entity,
- a staged play flow: Step 2 is locked until a goal is chosen; Step 3 is locked until the economy is run.

## Run locally

```bash
cd lake-economy-prototype-v3
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The prototype imports Three.js and OrbitControls from a CDN using an import map. You need browser internet access unless you replace those imports with locally bundled dependencies in your repo build.

## File map

```text
lake-economy-prototype-v3/
  README.md
  index.html
  styles.css
  src/
    app.js
    chart.js
    economy.js
    scene.js
```

## Model notes

The economic model is still in `src/economy.js` and is separated from the Three.js scene.

The important displayed distinction is:

```text
player offers != firm capital after market clearing
```

In the UI, “actual capital change” means total firm capital after market clearing, measured relative to this lake’s equal-offer baseline. A negative value does not mean the firm disappears or has negative capital; it means the equilibrium capital for that firm is lower than in the equal-offer baseline for the same lake. The results table also separates player-position change from other-investor change.

## Known limitations

This is still a prototype. The 3D world uses simple Three.js primitives rather than custom GLTF assets.

The TPP, CSP, and HSG marks are placeholder text chips. Replace them with actual image/SVG logos in `index.html` and `styles.css`.

The Harbor Town terrain approach has been adapted rather than copied wholesale. The prototype uses the same idea of a nonlinear shore, rising land, and subtle noise, but the economy objects are rebuilt for the six-entity lake-economy model.

The Three.js dependency is loaded from a CDN. For production, bundle it through your app toolchain.

The frontier remains approximate; it uses a deterministic feasible grid plus seeded random simplex samples.
