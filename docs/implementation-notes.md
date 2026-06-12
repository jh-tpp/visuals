# Implementation Notes - Lake Economy Game

This note gives practical guidance for agents building a prototype.

## Build posture

Start with a blank-slate prototype. Do not force the first prototype into the existing website layout. First find the best interaction and visual concept. Integration can happen after the direction is chosen.

## Suggested stack

Preferred lightweight architecture:

- React or Next.js for UI state and page structure.
- TypeScript for the game model.
- Three.js or React Three Fiber for the lake scene.
- SVG, Canvas, or D3 for the frontier chart.
- No backend for the MVP.
- No database for the MVP.

The model should run client-side.

## Code separation

Keep the economic model separate from the visual layer.

Suggested structure:

```text
src/
  game/
    economyTypes.ts
    scenarioTemplates.ts
    generateLakeEconomy.ts
    solveEconomy.ts
    computeFrontier.ts
    scoreRun.ts
  components/
    LakeScene.tsx
    OfferPanel.tsx
    EntityCard.tsx
    ResultsPanel.tsx
    FrontierChart.tsx
  pages or app/
    index.tsx
```

The scene should read solved game state. It should not contain economic logic.

## Determinism

A run of the same lake should be deterministic.

```text
Same lake + same offers = same result
```

Randomness should enter only when generating a new lake.

Use seeded randomness if practical so runs can be reproduced and shared later.

## Scenario templates

Do not fully randomize everything. Start from validated templates and randomize only within safe bounds.

Recommended templates:

1. Feed bottleneck
2. Market access bottleneck
3. Scalable entrepreneur
4. Dirty growth trap

Each template should produce a valid mathematical system.

## Feasibility and safe parameter generation

Parameter generation should avoid broken systems.

Basic requirements:

- No negative baseline firm sizes.
- No impossible final sizes in ordinary play.
- Supply and demand matrices should produce stable responses.
- Financial cost matrix should be positive semidefinite, preferably positive definite after regularization.
- Frontier computation should not fail for normal offer vectors.

For the MVP, it is acceptable to use hand-tuned parameter sets rather than complex random generation.

## Minimal model flow

1. Generate entity data:

```text
K0, expectedBusinessPayoff, risk, g_lake, g_prosperity
```

2. Generate hidden matrices:

```text
Phi_S, Phi_D, C, A
```

3. Player chooses offers:

```text
b_n >= 0
sum_n b_n = 100
```

4. Solve response:

```text
Delta phi = alpha * b
Delta K = C * Delta phi
```

5. Compute outcomes:

```text
Delta lake = g_lake' Delta K
Delta prosperity = g_prosperity' Delta K
Delta blended = nu * Delta lake + (1 - nu) * Delta prosperity
```

6. Compute financial result:

```text
financialCost = 0.5 * b' A b
businessPayoff = mu' Delta K
riskPenalty = optional quadratic term
```

7. Compute frontier score using the same feasible offer set.

## Frontier computation

For MVP, a grid search or simple numerical optimization is fine. There are only six entities.

Constraints:

```text
b_n >= 0
sum_n b_n = 100
```

For the first version, frontier scoring can be approximate if it is stable and intuitive. The visual should not imply excessive precision.

## UI recommendations

The homepage should keep paper access easy.

Suggested top-level layout:

- hero title and one-line explanation,
- buttons for Paper 1, Paper 2, and Play,
- interactive Lake Economy panel,
- compact tabs or sections for Overview, Papers, Play, Methods.

When Play is active, the game can take visual priority, but paper links should remain accessible.

## Entity cards

Before a run, show only:

- expected business payoff,
- risk,
- lake health intensity,
- local prosperity intensity.

Do not show hidden responsiveness or contribution multipliers.

After a run, show:

- player offer,
- actual capital added,
- lake health effect,
- local prosperity effect,
- financial result.

The user should infer the response system through repeated runs.

## Visual scene

The visual scene should make the economy legible:

- lake in the middle,
- investable entities around it,
- other investors visible but not distracting,
- meters for lake health and local prosperity,
- frontier chart to the side or in a diagnostic panel.

The visual style should be charming, lightweight, and fast.

## MVP acceptance standard

A good MVP does four things:

1. The user understands they are setting offers, not directly placing final capital.
2. The same offers in the same lake always produce the same result.
3. The user can improve their frontier score by learning the response system.
4. The game still leaves a clear path to download or read the papers.

## Deferred features

Do not add these until the core loop works:

- coalition negotiation,
- policy cards,
- stewardship cards,
- borrowing,
- multi-period dynamics,
- noisy outcome shocks inside repeated runs,
- full paper math UI,
- complex agent personalities.
