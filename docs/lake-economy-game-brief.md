# Lake Economy Game - Canonical Design Brief

Version: 0.1 working brief  
Project context: website front page for the Impact Frontier / Shifting the Frontier project  
Purpose: provide a comprehensive but refined design brief for agents or developers building the interactive homepage game

## 1. Core idea

The homepage should include a small, charming, interactive economy that lets users play with the central idea behind the project.

This should not feel like an ESG game where the user simply chooses virtuous firms. It should feel like a toy market-clearing economy. The player sets offers to different investable entities. The market responds. Firms scale up or down. External outcomes change. The result is compared with an Impact Frontier.

The central lesson is:

> The best offer is not necessarily the highest-score offer or the most profitable offer. It is the offer that moves the system most efficiently for the financial cost.

The player should learn by experimenting. They should set offers, run the economy, observe what actually happens, and gradually infer which parts of the economy are responsive, complementary, risky, or bottlenecked.

## 2. Teaching goal

The game should teach one idea cleanly:

> Financial choices affect real outcomes through a response system.

The important distinction is between:

1. what the player tries to fund,
2. what the economy actually funds after market clearing,
3. how firm capital changes,
4. how financial and external outcomes change,
5. whether the result lies near the Impact Frontier.

This distinction is the point. The game should avoid telling users that they directly allocate final firm capital. They set offer strengths or bid shifts. The economy then clears.

## 3. World concept: Lake Economy

The game world should be a stylized lake economy inspired by the Gatsby Africa Aquaculture Program case. The source story involves aquaculture, feed, farms, market links, private capital, local jobs, import substitution, and Lake Victoria ecosystem protection. This makes a lake economy a natural setting.

The world should be self-contained enough to be legible on a website homepage. A lake is better than an ocean because it feels bounded, local, and system-like.

The visual tone should be charming but not childish:

- low-poly or toy-like 3D,
- clean and lightweight,
- slightly cartoony,
- serious enough for a research project,
- clear enough that users can understand the economy quickly.

A good mental image is: a small lake surrounded by farms, a feed mill, a hatchery, cold-chain infrastructure, local markets, other investors, and a lakefront industrial firm.

## 4. Player role

The player is not a planner. The player is an outside investor or funder invited by local leaders to help finance the next stage of the lake economy.

Suggested story:

> Local leaders have invited you to help finance the next stage of the lake economy. You are large enough to matter, but not large enough to control the whole system.

This lets the player matter visibly without implying omnipotence. It also prepares the way for Paper 2 extensions where coalition size matters.

The player should control a limited amount of offer power. They are not directly placing final capital into firms. They are shifting their willingness to supply capital to different investable entities.

## 5. Main interaction loop

The main loop should be simple:

1. A new lake economy is generated.
2. The player sees investable entities with visible firm cards.
3. The player allocates offer tokens across entities.
4. The player clicks **Run economy**.
5. The economy clears deterministically for that lake.
6. The scene animates the response.
7. The game shows:
   - the player's offers,
   - capital actually added or reduced,
   - financial result,
   - lake health result,
   - local prosperity result,
   - position relative to the Impact Frontier.
8. The player can adjust offers and run the same economy again.
9. The player can start fresh or generate a new lake.

The interaction should reward iteration. The player should feel that they are discovering the system.

## 6. Button language and controls

Use three distinct actions:

- **Run economy** - solve the current lake economy using the current offers.
- **Start fresh** - keep the same lake economy but clear the player's offers.
- **New lake** - redraw the economy parameters and generate a new playable system.

Avoid ambiguous terms like “reset bids” in the final UI unless needed for internal documentation. “Start fresh” is cleaner for users.

The player's offer sliders should remain visible after each run. The player should be able to revise and rerun quickly.

The UI should show:

- current offers,
- last run result,
- best result achieved in this lake,
- frontier score for the current run.

## 7. Offer tokens and budget constraint

The player has 100 offer tokens. These represent offer power, not final investment dollars.

The player chooses non-negative offers across investable entities:

```text
b_n >= 0
sum_n b_n = 100
```

The tokens define the player's supply shifter. The economy then determines the effect on firm capital.

In mathematical terms, a simple MVP can treat the offer vector as:

```text
Delta phi_i = alpha * b
```

where `b` is the player's offer vector and `alpha` scales the game units into the economic model.

The economy response can be represented locally as:

```text
Delta K = C(f) * Delta phi_i
```

where:

- `Delta K` is the equilibrium change in firm capital,
- `C(f)` is the response matrix for a player or coalition of size `f`,
- `f` can be fixed in the MVP and exposed later.

The key UI point:

> Your offers are not the same as the capital actually added.

The game should make this visible.

A useful results display:

| Entity | Your offer | Capital actually added | Outcome effect |
|---|---:|---:|---:|

The table can be visual rather than literal, but the distinction should be clear.

## 8. Marginal vs non-marginal player

For the game, the player should be meaningful relative to the lake economy. A purely marginal investor may be too abstract and visually unsatisfying.

The recommended MVP posture:

- The player is large enough to affect the lake economy.
- The exact size does not need to be shown at first.
- The model can internally use a fixed player size, such as 5-15 percent of relevant capital influence.
- A later Paper 2 mode can expose player size as a control:
  - small investor,
  - lead investor,
  - coalition.

The important design constraint is conceptual honesty: do not describe the player as directly choosing final firm sizes. They set offers; the system responds.

## 9. Other investors

Other investors should be visible from the start, even if they are not interactive in the MVP.

They can appear as:

- a small investor crowd,
- a local bank,
- a pension fund building,
- a family office building,
- a “market capital” pool.

Their purpose is to communicate:

> You are not investing into a vacuum. Other capital is already there.

In the model, other investors are represented by the aggregate supply slope matrix or the non-player part of the supply system. Later, the player can recruit some of them into a coalition.

## 10. Investable entities

The MVP should use six investable entities. All six should be investable.

### 1. Scalable fish farm

Role:

- high local prosperity potential,
- high risk,
- can absorb capital in some economies,
- visually represented by an ambitious entrepreneur or expanding ponds.

Possible visible cues:

- energetic founder,
- new ponds under construction,
- workers moving actively.

### 2. Steady fish farm

Role:

- safer,
- less scalable,
- locally useful,
- may have weaker system response than the scalable farm.

Possible visible cues:

- stable ponds,
- modest operations,
- conservative owner.

### 3. Feed mill

Role:

- potential system bottleneck,
- improves fish farm productivity,
- may be less visibly “impactful” than farms but can be highly important.

Possible visible cues:

- bags of feed,
- trucks delivering feed,
- small industrial facility near farms.

### 4. Hatchery

Role:

- improves fish survival, quality, and productivity,
- complements fish farms,
- may be risky or specialized.

Possible visible cues:

- tanks,
- fingerlings,
- technical staff.

### 5. Cold chain / market access

Role:

- helps farms sell into stable markets,
- reduces waste,
- can unlock demand for local production,
- may be the hidden lever in some scenarios.

Possible visible cues:

- refrigerated truck,
- market stall,
- small warehouse.

### 6. Lakefront industry

Role:

- financially attractive,
- creates jobs,
- damages lake health,
- competes with aquaculture for labor, land, water quality, finance, or political attention.

This should not be a cartoon villain. It should be a real trade-off.

Possible visible cues:

- factory by the lake,
- smoke or runoff,
- workers,
- high-payoff visual signals.

## 11. Non-investable visible elements

Some elements should be visible but not investable in the MVP.

### Local leaders

They provide the invitation and story context. They do not need to be part of the economic model.

### Import pressure

Imports can appear as an outside competitor, perhaps as a ship, truck, or market-price pressure indicator. The player may reduce import pressure indirectly by building a more competitive local system.

Imports do not need to be investable in v1.

### Regulator

A regulator or public building can be visible, but regulation should not be an active lever in v1. Regulation belongs to a later Paper 2 mode.

## 12. Firm cards

Each investable entity should have a compact visible card.

Show:

- expected business payoff,
- risk,
- lake health intensity,
- local prosperity intensity.

Do not initially show:

- responsiveness,
- contribution multipliers,
- full pass-through values,
- hidden system links,
- the exact response matrix.

The user should infer response from repeated runs.

Suggested labels:

- **Expected business payoff** rather than “expected return”.
- **Risk**.
- **Lake health**.
- **Local prosperity**.

Reason: “Expected return” is awkward because security-level returns are determined after pricing and market clearing. “Expected business payoff” is a better firm-side primitive for the game.

## 13. Outcome variables

The game should show two external outcome meters:

1. **Lake health**
2. **Local prosperity**

The player chooses a blended objective using a simple slider:

```text
Lake health <----------------> Local prosperity
```

The model combines the two outcome-intensity vectors into one chosen objective:

```text
g(nu) = nu_lake * g_lake + nu_prosperity * g_prosperity
```

with:

```text
nu_lake + nu_prosperity = 1
```

The Impact Frontier is then computed for the chosen blended objective.

Do not introduce a full multi-outcome frontier in the MVP. It is interesting but too complex for the homepage.

## 14. Preset offer strategies

Include a small preset menu to help users start.

Recommended presets:

1. **Highest business payoff**
   - Put most or all offer tokens into the entity with the highest expected business payoff.

2. **Highest raw outcome intensity**
   - Put most or all offer tokens into the entity with the highest chosen blended raw outcome intensity.

3. **Equal offers**
   - Split offer tokens equally across all investable entities.

Possible later preset:

4. **Frontier hint**
   - Available only after the player has played once or twice.
   - Nudges toward the response-adjusted solution without fully revealing it.

Avoid “market allocation” as a preset in v1. It is conceptually too slippery in a fictional lake economy because the market allocation depends on clearing, prices, and existing capital.

Internally, “spray and pray” can describe equal offers, but the UI should probably use “Equal offers”.

## 15. Frontier scoring

Chart convention: the Impact Frontier chart should put expected outcome change on the horizontal axis and certainty-equivalent return, or a plain-language risk-adjusted return result, on the vertical axis. The UI should not plot "financial cost" as the main vertical variable. Financial cost can be used internally for scoring, but the visible chart should follow the standard convention: more outcome to the right, better financial result upward.

The game should report whether the player reached the Impact Frontier.

A simple user-facing message:

> You reached 63 percent of the frontier at this risk-adjusted return.

The exact MVP scoring can be:

1. Compute the player's chosen offer vector `b`.
2. Compute the resulting financial certainty-equivalent score `CE(b)`. This should be called risk-adjusted return in all player-facing communications.
3. Compute the outcome score `O(b)` for the chosen blended outcome.
4. Compute the best feasible outcome at the same financial cost.
5. Report the ratio:

```text
frontier_score = O(b) / O_star(CE cost of b)
```

If O_star <= 0, do not report a percentage. Show a text result instead.
If O(b) < 0, report that the offer moved against the chosen goal.
Cap displayed frontier scores at 100% unless explicitly showing approximation error.
Use "about" or "roughly" for approximate grid-based frontier scores.

A clean reference formulation:

```text
CE_loss(b) = CE(b_financial) - CE(b)
```

where `b_financial` is the best purely financial feasible offer vector under the game's constraints.

Then:

```text
O_star(L) = max O(b) subject to CE_loss(b) <= L, b_n >= 0, sum_n b_n = 100
```

and:

```text
frontier_score = O(b) / O_star(CE_loss(b))
```

The optimization must respect the same feasible set as the player:

```text
b_n >= 0
sum_n b_n = 100
```

So the homepage frontier is a constrained playable frontier, not necessarily the clean unconstrained frontier from the academic paper.

## 16. Economic model skeleton

The MVP can use a local affine response system.

### Main variables

For `N = 6` investable entities:

| Symbol / variable | Meaning | Visible to user? |
|---|---|---|
| `K0` | current firm size | yes, visually |
| `mu` | expected business payoff | yes |
| `Sigma` | payoff covariance / risk matrix | summarized as risk |
| `g_lake` | lake health intensity | yes |
| `g_prosperity` | local prosperity intensity | yes |
| `PhiS` | aggregate supply slope matrix | hidden |
| `PhiD` | firm demand slope matrix | hidden |
| `C(f)` | response matrix | hidden in v1 |
| `b` | player offer vector | yes |
| `DeltaK` | actual capital response | yes after run |

### Response matrix

For a fixed player or coalition size `f`, the response matrix can be represented as:

```text
C(f) = inverse(PhiS + (1 - f) * PhiD) * PhiS
```

For an MVP, `f` can be fixed. Later, `f` can become a player-size or coalition-size control.

### Outcome

For chosen outcome weights `nu`:

```text
g = nu_lake * g_lake + nu_prosperity * g_prosperity
O(b) = g' * DeltaK
```

### Financial score

The financial side can be represented with a simple certainty-equivalent score:

```text
CE(b) = expected_payoff(b) - risk_penalty(b)
```

A practical MVP approximation:

```text
CE(b) = mu' * k_player(b) - 0.5 * gamma * k_player(b)' * Sigma * k_player(b)
```

where `k_player(b)` may initially be approximated by the player's offer vector or by a simple player-allocation response. However, the UI should still call `b` an offer vector, not final firm capital.

Longer-term, the engine can separately solve for:

- player allocation,
- other-investor allocation,
- prices,
- firm capital,
- external outcome.

The UI can stay the same while the engine becomes more faithful.

## 17. Combinatorial effects

The game should represent combinatorial effects through system links.

In v1, use linear off-diagonal response terms rather than nonlinear threshold bonuses.

The point is that one entity's funding can make another entity more viable.

Examples:

| Capital shift toward... | Helps... | Hurts... |
|---|---|---|
| Feed mill | fish farms | possibly lake health if feed is dirty |
| Hatchery | fish farms | usually none |
| Cold chain / market access | fish farms, feed mill | import pressure |
| Fish farms | feed mill, cold chain | lake health if poorly managed |
| Lakefront industry | local jobs | lake health, fish farms |

The player should not see the full interaction matrix at first. They should infer it from how the economy responds.

Later, a combinatorial mode can add threshold effects:

- feed + farms + cold chain unlock a local industry shift,
- too much lake stress causes fish productivity to fall,
- market access creates a step-change in farm demand.

These should be deferred until the linear version is working.

## 18. Off-diagonal terms

The hidden matrices should be economically interpretable.

### Demand-side links

Demand-side off-diagonal terms should capture real-economy complements and substitutes.

Examples:

- Feed mill capital increases fish farm scalability.
- Hatchery capital increases fish farm productivity.
- Cold chain capital increases fish farm and feed mill viability by expanding market access.
- Fish farm capital increases demand for feed and cold chain.
- Lakefront industry may reduce aquaculture viability through pollution, labor competition, or political attention.

### Supply-side links

Supply-side off-diagonal terms can capture investor-side spillovers, substitution, or shared risk perceptions.

Examples:

- Other investors may view fish farms, hatchery, feed mill, and cold chain as part of the same aquaculture theme.
- Funding one aquaculture node may draw attention to or away from others.
- Lakefront industry may be viewed as a separate financial theme.

### Payoff covariance

Payoff covariance should be intuitive:

- aquaculture entities tend to have positively correlated payoffs,
- feed and farms are especially linked,
- cold chain may diversify some farm risk,
- lakefront industry may have lower or even negative correlation with aquaculture,
- lake health shocks can affect farms, hatchery, and local markets.

## 19. Scenario templates

Randomness should be controlled by scenario templates. Do not fully randomize the economy.

Each template should use bounded parameter draws that preserve a valid economic solution.

### Template 1: Feed bottleneck

Core idea:

- Fish farms have high raw outcome intensity.
- Feed mill is the hidden lever.
- Funding farms alone helps less than expected because feed quality or supply constrains scaling.
- Funding feed mill can unlock farm growth.

Likely lesson:

> The most visible impact node is not always the best first offer.

### Template 2: Market access bottleneck

Core idea:

- Farms can produce, but market access is weak.
- Cold chain / market infrastructure has high system importance.
- Funding cold chain improves the viability of farms and feed.

Likely lesson:

> Infrastructure can move the frontier even when its raw outcome intensity looks modest.

### Template 3: Scalable entrepreneur

Core idea:

- One fish farm can absorb capital unusually well.
- Visual cues should hint at ambition and readiness to scale.
- Another fish farm may be safer but less responsive.

Likely lesson:

> Raw outcome intensity must be combined with the ability to scale.

### Template 4: Dirty growth trap

Core idea:

- Lakefront industry has high expected business payoff and creates jobs.
- It damages lake health and weakens aquaculture.
- The player must decide how much financial payoff to give up for lake health and long-run local prosperity.

Likely lesson:

> The financially attractive offer can move the economy in the wrong outcome direction.

## 20. Parameter validity constraints

Each generated lake economy must be mathematically and economically safe.

The generator should enforce:

- positive current firm sizes,
- non-negative visible capital after a run,
- finite and stable response matrix,
- bounded risk values,
- bounded outcome intensities,
- no absurd frontier shapes,
- no infeasible optimization results,
- no giant one-entity domination unless intentionally part of a template.

Practical guardrails:

- Keep `PhiS` and `PhiD` diagonally dominant or otherwise regularized.
- Ensure the matrix being inverted is well-conditioned.
- Scale `alpha` so `K0 + DeltaK` stays positive.
- Cap visual changes even if internal values are larger.
- Test each template with many random seeds.
- Reject and redraw invalid parameter sets.

## 21. Visual design

The visual scene should dominate the game panel. The frontier chart should be visible but not overwhelming.

Recommended layout:

- left or center: toy lake economy,
- right side: offer controls and firm cards,
- lower or side panel: Impact Frontier chart,
- top bar: project title and paper links.

The frontier chart should feel like a diagnostic instrument, not the whole experience.

Visual effects after running the economy:

- firms grow or shrink slightly,
- lake color improves or worsens subtly,
- fish population indicator changes,
- workers/jobs indicator changes,
- offer tokens move toward entities,
- capital response appears as a second layer distinct from offers.

Coin flows, pipes, or boats are optional. They should not clutter the scene.

## 22. Homepage integration

The game must not block users who simply want to access the papers.

Recommended page structure:

### Hero area

- project title,
- one-line project explanation,
- buttons:
  - Read Paper 1,
  - Read Paper 2,
  - Read Investors' Guide,
  - Play the model.

### Interactive area

Tabs or modes:

- Overview,
- Papers,
- Play,
- Methods.

When the user clicks **Play**, the page can shift into game mode. Standard page elements can compress into a small header.

The site should load quickly. A static or lightly animated lake scene can appear first; full game controls can load after user interaction.

## 23. Technical architecture

Recommended technical split:

- Three.js for the lake economy scene.
- SVG, Canvas, or D3 for the Impact Frontier chart.
- TypeScript for the economic engine.
- React / Next.js for the page shell and state management.
- URL state for shareable lake seeds and offer vectors.

The economic engine should be separate from rendering.

Suggested modules:

```text
/game
  /engine
    generateLake.ts
    solveEconomy.ts
    computeFrontier.ts
    scoreRun.ts
    scenarioTemplates.ts
  /ui
    LakeScene.tsx
    OfferPanel.tsx
    FirmCard.tsx
    FrontierChart.tsx
    ResultPanel.tsx
  /types
    economy.ts
    firm.ts
    runResult.ts
```

The MVP should be client-side. No server is needed unless analytics, saved runs, or dynamic paper content are added later.

## 24. MVP scope

The MVP should include:

- six investable entities,
- deterministic run within each generated lake,
- controlled random lake generation,
- three preset offer strategies,
- offer sliders with 100 tokens,
- two visible outcome meters,
- one blended objective slider,
- hidden response system,
- constrained playable Impact Frontier,
- frontier score,
- result comparison between offers and actual capital response,
- charming lake visual,
- accessible paper links.

## 25. Deferred features

Defer these until after the MVP works:

- visible contribution multipliers,
- full education layer explaining response matrices,
- coalition recruitment,
- player-size slider,
- government policy tools,
- stewardship tools,
- nonlinear threshold effects,
- stochastic shocks within a lake,
- borrowing or leverage,
- short positions,
- full multi-outcome frontier,
- exact calibration to Paper 1 empirical objects,
- live data,
- full price and holdings clearing model.

## 26. Paper 1 and Paper 2 alignment

### Paper 1 alignment

The MVP should communicate the Paper 1 idea:

- A portfolio tilt shifts capital supply.
- The real outcome depends on equilibrium response.
- Raw outcome intensity alone is not enough.
- The Impact Frontier compares expected outcome change with financial cost.

The homepage should not overburden users with the full paper terminology. It can introduce the Impact Frontier visually first and explain details later.

### Paper 2 alignment

The design should be expandable into Paper 2:

- larger player size,
- investor coalitions,
- government wedges,
- stewardship levers,
- instruments that shift the frontier rather than merely move along it.

The UI should therefore avoid design choices that assume the player is always infinitesimal or that portfolio tilts are the only intervention.

## 27. What the game should not do

The game should not:

- imply that investing is only about picking virtuous firms,
- imply that raw scores solve the allocation problem,
- imply that the player directly controls firm capital,
- hide the distinction between offers and actual capital response,
- make the polluting firm a simplistic villain,
- make the game so complex that users cannot quickly understand it,
- make paper downloads hard to find,
- present stochastic noise as the main lesson,
- expose contribution multipliers too early,
- require users to understand finance before playing.

## 28. Agent challenge version

A future agent challenge can use this brief as the source. The challenge should ask agents to produce either a visual concept or a working prototype.

Recommended challenge framing:

> Build a homepage prototype for the Impact Frontier project. The core interaction is a playable Lake Economy. The player sets offers to investable entities, the economy clears, firm capital and outcomes change, and the result is scored against a constrained Impact Frontier. The prototype should be charming, lightweight, intuitive, and faithful to the distinction between offers, market response, and outcome change.

Evaluation criteria:

- Does it teach the right idea?
- Is it charming?
- Is the interaction intuitive?
- Is the economics misleading anywhere?
- Is it technically lightweight?
- Can it sit on the homepage without blocking access to papers?
- Is the code structured so the economic engine can improve later?

## 29. Open technical questions

These do not block the MVP, but they should be resolved before implementation hardens.

1. Should the MVP approximate player allocation by the offer vector, or solve a separate player allocation response?
2. What exact certainty-equivalent score should be used in the game engine?
3. How should the financial-only reference offer `b_financial` be defined?
4. Should the initial player size `f` be fixed at 5 percent, 10 percent, or left implicit?
5. How strongly should visual cues hint at hidden responsiveness?
6. Should the frontier chart appear immediately, or only after the first run?
7. How much explanatory text should appear inside the game versus below it?
8. Should “Lake health” and “Local prosperity” be symmetric in the UI, or should one be the default focus?
9. Should the first public version include a Gatsby-inspired note, or keep the case inspiration implicit?
10. How close should the MVP economic model stay to the exact Paper 1 notation?

## 30. Best current design statement

The strongest current version is:

> A charming lake economy sits on the homepage. The player is invited to help finance its next stage. They set offers to fish farms, feed, hatchery, cold chain, and lakefront industry. The economy clears. Their offers are not the same as the capital that actually gets added. Lake health, local prosperity, and financial results change. A small frontier chart shows whether their strategy was efficient. By trying again, the player learns that impact depends on the response system, not just raw scores or profitability.
