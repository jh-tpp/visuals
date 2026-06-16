# Lake Economy Game - Canonical Design Brief

Version: 0.2 working brief  
Project context: research website front page for The Impact Frontier and Shifting the Frontier project  
Status: updated after the v3 working prototype

## 1. Current direction

The website is a research website first. The interactive economy is the homepage centerpiece, not the identity of the whole site.

The page should feel like:

```text
A serious research homepage with a beautiful interactive harbor economy in the background.
```

Use **The Impact Frontier** as the visible research-site title. Do not make the page feel like it is titled **Lake Economy**. Lake Economy can remain the internal name for the playable model and the stylized world.

The current lead visual direction is a clean harbor-front economy:

- a white or off-white top navigation bar,
- TPP, CSP, and HSG logo positions,
- visible title text: **The Impact Frontier**,
- permanent buttons for Papers, Guides, Methods, and Play,
- a harbor-style 3D economy below the bar,
- a compact Play panel that opens without covering or darkening the economy,
- Papers and Guides panels that sit above the economy when opened.

The game should be impressive enough to create a "gee whiz" effect, but the research must remain easy to access.

## 2. Core idea

The homepage should include a small, charming, interactive economy that lets users play with the central idea behind the research.

This should not feel like an ESG ranking game where the user simply chooses virtuous firms. It should feel like a toy market-clearing economy. The player sets offers to different investable entities. The market responds. Firms scale up or down. External outcomes change. The result is compared with an Impact Frontier.

The central lesson is:

> The best offer is not necessarily the highest-score offer or the most profitable offer. It is the offer that moves the system most efficiently for the financial cost.

The player should learn by experimenting. They should set offers, run the economy, observe what actually happens, and gradually infer which parts of the economy are responsive, complementary, risky, or bottlenecked.

## 3. Teaching goal

The game should teach one idea cleanly:

> Financial choices affect real outcomes through a response system.

The important distinction is between:

1. what the player tries to fund,
2. what the economy actually funds after market clearing,
3. how firm capital changes,
4. how financial and external outcomes change,
5. whether the result lies near the Impact Frontier.

This distinction is the point. The game should avoid telling users that they directly allocate final firm capital. They set offer strengths or bid shifts. The economy then clears.

The UI should repeatedly make this concrete:

```text
Offer tokens are not final capital.
```

## 4. Homepage identity and top bar

The top of the page should be a clean research-site bar, not a game HUD.

Current target:

```text
[TPP logo] [CSP logo] [HSG logo]  The Impact Frontier        Papers  Guides  Methods  Play
```

Notes:

- Use real logo assets when available.
- Use text placeholders only in prototypes.
- Keep the bar white or off-white.
- Keep the bar permanently visible.
- Papers and Guides should be first-class navigation, not secondary links hidden inside the game.
- The Play button can sit at the top left or in the top bar, but it should remain visually simple and white.
- Opening Papers, Guides, or Methods should open a large panel above the economy. The economy can remain visible behind it, but it should become background.
- Do not darken, blur, or gray out the economy when panels are open.

## 5. World concept: harbor-front lake economy

The original concept was a lake economy. The current visual target is more specific:

```text
A harbor-front lake economy with all investable entities arranged along one shoreline.
```

This is better than a lake-in-the-center layout because it lets the user look into the economy from a natural viewing angle. It also supports a cleaner research-homepage feel.

The world is still a lake economy in economic and narrative terms. It is visually rendered as a harbor or waterfront economy:

- blue water in front,
- a non-trivial shoreline,
- quays or harbor edges where appropriate,
- green land rising gently away from the water,
- all investable entities arranged along the shoreline,
- low-rise town structures behind them,
- roads, trucks, boats, trees, and ground detail.

The scene should feel plausibly inspired by an African lake economy without becoming stereotyped, judgmental, or caricatured. Avoid skyscraper-city aesthetics. Avoid making the town look like New York. Use modest low-rise structures, small industrial buildings, market access infrastructure, and working waterfront details.

The visual tone should be:

- bright,
- clean,
- serious enough for a research project,
- charming but not childish,
- realistic enough to avoid arcade or cartoon morality-play vibes,
- closer to a model-town or architectural visualization than a game board.

Preferred background direction:

- white, off-white, eggshell, or light grey surroundings,
- blue water,
- green terrain,
- optional subtle sky gradient,
- avoid the yellow/orange background from the Harbor Town reference,
- avoid dark-green, somber environmental-simulation styling.

## 6. Shoreline and terrain requirements

The shoreline is important. It should not be a simple straight edge.

The target shoreline should have:

- a non-trivial curved shape,
- a clean rendered edge between land and water,
- docks, quays, rocks, or small harbor details where useful,
- boats near the shore,
- water extending to the usable border of the scene,
- green ground extending to the usable border of the scene.

Terrain should not be flat white or grey land with structures dropped onto it. Every structure in the economy should sit on sensible ground.

Terrain should:

- rise gently from the water level to the back of the scene,
- be a little undulating,
- remain legible and not too noisy,
- support all business pads and roads naturally,
- avoid visual artifacts such as flashing roofs or overlapping surfaces.

Use the Harbor Town reference for the broad idea of shoreline, terrain, camera controls, and boats, but do not copy its full evolution feature or its excessive density.

## 7. Boats and moving details

Include boats on the water. They should look like simple harbor or lake boats, not abstract spinning markers.

Good boat direction:

- several small boats,
- simple low-poly hulls,
- different colors on some boats,
- gentle movement if cheap and smooth,
- no distracting animation.

Cut ambiguous moving objects such as yellow spinning lake markers. If a visual element does not clearly mean something, remove it.

Useful moving details:

- boats moving slowly,
- trucks near the feed mill or cold chain,
- light smoke from the lakefront industry,
- subtle water motion,
- offer bars filling beside entities,
- response bars after the economy runs.

## 8. Investable entities

The MVP should use six investable entities. All six should be investable.

1. Scalable fish farm
2. Steady fish farm
3. Feed mill
4. Hatchery
5. Cold chain / market access
6. Lakefront industry

Each entity must have a distinct structure or area in the 3D economy. Each should have ground, road, quay, or site detail around it so it feels placed in the world rather than floating on a board.

### Scalable fish farm

Role:

- high local prosperity potential,
- high risk,
- can absorb capital in some economies,
- visually represented by expanding ponds, workers, or an ambitious operation.

Possible cues:

- multiple ponds,
- construction or expansion detail,
- active workers,
- more energetic visual treatment than the steady farm.

### Steady fish farm

Role:

- safer,
- less scalable,
- locally useful,
- may have weaker system response than the scalable farm.

Possible cues:

- stable ponds,
- modest operations,
- simpler and calmer visual treatment.

### Feed mill

Role:

- potential system bottleneck,
- improves fish farm productivity,
- may be less visibly impactful than farms but can be highly important.

Possible cues:

- small industrial building,
- sacks or silos,
- light brown truck,
- delivery road.

### Hatchery

Role:

- improves fish survival, quality, and productivity,
- complements fish farms,
- may be risky or specialized.

Possible cues:

- tanks,
- fingerling ponds,
- small technical building.

### Cold chain / market access

Role:

- helps farms sell into stable markets,
- reduces waste,
- can unlock demand for local production,
- may be the hidden lever in some scenarios.

Possible cues:

- refrigerated truck,
- warehouse,
- market access road,
- white truck near the building.

### Lakefront industry

Role:

- financially attractive,
- creates jobs,
- damages lake health,
- competes with aquaculture for labor, land, water quality, finance, or political attention.

This should not be a cartoon villain. It should be a real trade-off.

Possible cues:

- factory or processing plant near the water,
- smokestack with modest smoke,
- workers or trucks,
- visibly industrial but not exaggerated.

## 9. Non-investable visible elements

Some elements should be visible but not investable in the MVP.

### Other investors

Other investors should be visible from the start. They communicate:

> You are not investing into a vacuum. Other capital is already there.

Possible visual forms:

- local bank,
- small investor crowd,
- family office or capital pool building,
- market capital indicator,
- nearby finance district or modest office building.

Other investors do not need to be interactive in the MVP.

### Local leaders

Local leaders provide the invitation and story context. They do not need to be part of the economic model.

### Import pressure

Imports can appear as an outside competitor, perhaps as a ship, truck, or market-price pressure indicator. The player may reduce import pressure indirectly by building a more competitive local system.

Imports do not need to be investable in the MVP.

### Regulator

A regulator or public building can be visible, but regulation should not be an active lever in the MVP. Regulation belongs to a later Paper 2 mode.

## 10. Player role

The player is not a planner. The player is an outside investor or funder invited by local leaders to help finance the next stage of the lake economy.

Suggested story:

> Local leaders have invited you to help finance the next stage of the lake economy. You are large enough to matter, but not large enough to control the whole system.

This lets the player matter visibly without implying omnipotence. It also prepares the way for Paper 2 extensions where coalition size matters.

The player should control a limited amount of offer power. They are not directly placing final capital into firms. They are shifting their willingness to supply capital to different investable entities.

## 11. Main interaction loop

The main loop should be simple:

1. The research homepage loads with the 3D harbor economy visible.
2. The user can open Papers, Guides, or Methods at any time.
3. The user can click Play to open a compact game panel.
4. Step 1: the player chooses a goal.
5. Step 2: the player allocates 100 offer tokens across entities.
6. The player clicks **Run economy**.
7. The economy clears deterministically for that lake.
8. The scene animates the response.
9. The game shows:
   - the player's offers,
   - capital actually added or reduced relative to baseline,
   - player and other-investor capital changes where useful,
   - financial result,
   - lake health result,
   - local prosperity result,
   - position relative to the Impact Frontier.
10. The player can adjust offers and run the same economy again.
11. The player can Start fresh or generate a New lake.

The interaction should reward iteration. The player should feel that they are discovering the system.

## 12. Play panel and step gating

The Play panel should be compact and non-blocking. It should not cover the whole screen.

Preferred layout:

- left side,
- vertically compact,
- small enough that the user can still see and orbit the economy,
- no dark overlay,
- no grayed-out or blurred economy behind the panel.

The first run should guide the user through the steps:

### Step 1 - Choose goal

Initial state:

- no option selected,
- no default to Lake health, Balanced, or Local prosperity,
- the user must interact by clicking a button or moving the slider.

The goal control can use three buttons, a slider, or both:

- Lake health,
- Balanced,
- Local prosperity.

Once the user interacts with Step 1, unlock Step 2.

### Step 2 - Set offers

Initial state:

- greyed out until Step 1 is completed,
- the user must allocate all 100 tokens before Run economy is enabled.

The offer controls should remain visible after each run so the player can revise and rerun quickly.

Include helpful presets:

- Highest business return,
- Highest raw outcome intensity,
- Equal offers.

### Step 3 - Results and frontier

Initial state:

- greyed out until the user has completed Step 2 and clicked Run economy.

After a run, show:

- results summary,
- frontier score,
- chart,
- table showing offer versus actual capital change.

## 13. Button language and controls

Use three distinct actions:

- **Run economy** - solve the current lake economy using the current offers.
- **Start fresh** - keep the same lake economy but clear the player's offers.
- **New lake** - redraw the economy parameters and generate a new playable system.

Start fresh should clear the sliders to an unallocated 100-token pool. The player must reallocate all 100 tokens before running the economy again.

Avoid ambiguous language such as "reset bids" in the final UI unless needed in developer notes.

## 14. Offer tokens and visual offer indicators

The player has 100 offer tokens. These represent offer power, not final investment dollars.

The player chooses non-negative offers across investable entities:

```text
b_n >= 0
sum_n b_n = 100
```

Offer visibility should be clear in both the UI and the world.

Use:

- offer sliders in the Play panel,
- numeric offer bubbles above each entity,
- a simple visual offer bar beside each entity,
- yellow fill moving to the right as more is offered to a firm.

The visual offer bar is purely explanatory. It should not imply that the offer is final capital.

## 15. Actual capital language

Be explicit about what "actual capital" means.

Preferred UI label:

```text
Actual capital change vs baseline
```

or shorter:

```text
Total Delta K vs baseline
```

Avoid simply saying "actual capital" without explanation.

Definition:

```text
Actual capital change = K under current offers - K under equal-offer baseline
```

This is a baseline-relative change in total firm capital after market clearing. It is not the absolute firm size and not the player's direct funding.

A negative actual-capital change does not mean the firm disappears. It means less total capital clears into that firm than under the equal-offer baseline for the same lake.

Where useful, split the result into:

```text
Offer
Total Delta K
Player Delta K
Other investors Delta K
```

This makes it clear that a player offer can change the behavior of other investors and can shift capital away from other firms relative to baseline.

## 16. Entity cards and popups

Do not put permanent entity detail subpanels inside the Play panel.

Entity information should appear in compact popups.

Two ways to open a popup:

1. click the entity in the 3D economy,
2. click the entity link/name in the offer list.

Popup behavior:

- appears near the relevant entity when possible,
- closes when the user clicks outside it,
- has a close button,
- shows visible characteristics only before a run.

Before a run, show only:

- expected business return,
- risk,
- lake health intensity,
- local prosperity intensity.

Do not initially show:

- hidden responsiveness,
- contribution multipliers,
- full pass-through values,
- exact response matrix.

After a run, the popup can also show:

- player offer,
- total capital change versus baseline,
- player capital change versus baseline,
- other-investor capital change versus baseline,
- lake health effect,
- local prosperity effect,
- financial result.

The user should infer the response system through repeated runs.

## 17. Outcome variables

The game should show two external outcome meters:

1. Lake health
2. Local prosperity

The player chooses a blended objective using a simple goal control:

```text
Lake health <------> Local prosperity
```

The model combines the two outcome-intensity vectors into one chosen objective:

```text
g(nu) = nu_lake * g_lake + nu_prosperity * g_prosperity
nu_lake + nu_prosperity = 1
```

The Impact Frontier is then computed for the chosen blended objective.

Do not introduce a full multi-outcome frontier in the MVP.

## 18. Preset offer strategies

Include a small preset menu to help users start.

Recommended presets:

1. **Highest business return**
   - Put most or all offer tokens into the entity with the highest expected business return.

2. **Highest raw outcome intensity**
   - Put most or all offer tokens into the entity with the highest chosen blended raw outcome intensity.

3. **Equal offers**
   - Split offer tokens equally across all investable entities.

Possible later preset:

4. **Frontier hint**
   - Available only after the player has played once or twice.
   - Nudges toward the response-adjusted solution without fully revealing it.

Avoid "market allocation" as a preset in the MVP. It is too slippery in a fictional toy economy.

## 19. Economic model skeleton

The R file `lake_economy_model_prototype.R` is the current tested model reference. Port its economic structure into the website stack. Do not copy its plotting choices as the visual design.

The core structure is a non-marginal P/K-space clearing model:

```text
Player supply quantity: K_player(P,b) = c_player + E_player P + s_player(b)
Other supply quantity:  K_other(P)   = c_other  + E_other P
Aggregate supply:       K_S(P,b)     = c_supply + E_total P + s_player(b)
Demand inverse curve:   P_D(K)       = a_demand - B K
Supply inverse curve:   P_S(K,b)     = PhiS [K - c_supply - s_player(b)]
```

Clearing condition:

```text
P_S(K,b) = P_D(K)
```

Solution:

```text
K(b) = solve(PhiS + B, a_demand + PhiS * (c_supply + s_player(b)))
P(b) = a_demand - B * K(b)
```

Then compute:

```text
K_player(b)
K_other(b)
lake outcome
prosperity outcome
blended outcome
player CE or risk-adjusted return
```

The model preserves the key teaching distinction:

```text
The player chooses offers, not final capital installed.
```

## 20. Frontier scoring

The visible chart should use the project convention:

```text
x-axis: expected outcome change
y-axis: risk-adjusted return
```

The internal model may compute CE values or CE loss. Convert this into a plain-language risk-adjusted-return framing for the UI where practical.

The frontier should be the playable constrained frontier, not a fully unconstrained analytical frontier.

Constraints:

```text
b_n >= 0
sum_n b_n = 100
```

Baseline:

```text
equal offers
```

For the player's result, compute:

```text
outcome gain vs equal-offer baseline
risk-adjusted return change vs equal-offer baseline
```

For the frontier score, compare the player's outcome gain with the best feasible outcome gain at no worse financial cost or risk-adjusted-return loss.

Suggested UI language:

```text
You reached 72% of the frontier for this goal.
```

Keep the language concrete. Avoid implying moral failure when the score is low. The player is learning the system.

## 21. Scenario templates

Do not fully randomize the economy. Start from validated templates and randomize only within safe bounds.

Use four primary templates:

1. Feed bottleneck
2. Market access bottleneck
3. Scalable entrepreneur
4. Dirty growth trap

Each template should produce a valid mathematical system.

Each New lake should feel meaningfully different, but not mathematically wild.

## 22. Parameter validity constraints

Parameter generation should avoid broken systems.

Basic requirements:

- no negative baseline firm sizes,
- no impossible final sizes in ordinary play,
- stable supply and demand matrices,
- positive semidefinite or regularized positive definite financial-cost/risk matrix,
- frontier computation does not fail for normal offer vectors,
- same lake plus same offers gives the same result,
- randomness enters only when generating a new lake.

Negative Delta K relative to baseline is acceptable. Negative final firm capital in normal play is not.

## 23. Homepage panels

Papers, Guides, and Methods should open large panels above the economy.

Panel rules:

- do not remove the economy from view,
- do not darken or blur the economy,
- panel content can be normal HTML,
- paper screenshots and guide cards can be added later,
- the user should be able to close the panel and return to the live scene.

Suggested panel roles:

### Papers

Paper 1: The Impact Frontier  
Paper 2: Shifting the Frontier

### Guides

Investor guides and related plain-language material.

### Methods

Short explanation of the offer-clearing-frontier loop and links to technical notes.

## 24. Technical architecture

Preferred lightweight architecture:

```text
React or Next.js
TypeScript
Three.js or React Three Fiber
SVG or D3-style charting
client-side model
no backend for MVP
no database for MVP
```

Keep model logic separate from visuals.

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
    HarborScene.tsx
    PlayPanel.tsx
    EntityPopup.tsx
    ResultsPanel.tsx
    FrontierChart.tsx
    ResearchPanel.tsx
  app/
    page.tsx
```

The scene should read solved game state. It should not contain economic logic.

For quick prototypes, vanilla JS with separated files is acceptable if it keeps the model, scene, chart, and UI separated.

## 25. MVP scope

The MVP should include:

- research-site top bar,
- harbor-front 3D economy,
- orbit and zoom controls,
- six investable entities,
- compact non-blocking Play panel,
- goal choice before offers,
- 100-token offer allocation,
- deterministic Run economy,
- Start fresh,
- New lake,
- frontier chart or frontier score,
- visible distinction between offers and capital changes,
- entity popups,
- Papers and Guides access.

## 26. Deferred features

Defer:

- coalition negotiation,
- policy cards,
- stewardship cards,
- borrowing,
- multi-period dynamics,
- noisy shocks inside repeated runs,
- time evolution of the town,
- density controls,
- full paper math inside the game UI,
- hidden matrix reveal before the user has played.

Paper 2 should influence architecture, not MVP surface area.

## 27. Paper 1 and Paper 2 alignment

Paper 1 alignment:

- investor sets offers,
- firms and other investors respond,
- market clears,
- outcomes change,
- result is compared with a frontier.

Paper 2 alignment:

- future modes may change investor size, coalition size, policy wedges, or stewardship actions,
- larger coalitions are not simply scaled-up small investors,
- different instruments shift the frontier through different margins and costs.

Do not put Paper 2 modes in the MVP.

## 28. What the game should not do

Do not:

- make the whole website feel titled Lake Economy,
- hide the research behind the game,
- make the game a simple ESG ranking exercise,
- make the player an all-powerful planner,
- say the player directly chooses final capital,
- hide Papers and Guides inside the game,
- darken, blur, or gray out the economy during play,
- use full-screen step modals for the main flow,
- put permanent entity-card subpanels inside the Play panel,
- use ambiguous decorative objects such as spinning yellow markers,
- show hidden responsiveness or contribution multipliers at the start,
- make the lakefront industry an evil villain,
- imply all aquaculture is automatically environmentally good,
- claim to simulate the actual Gatsby program,
- overbuild a full financial simulator for the homepage MVP.

## 29. Open technical questions

Remaining choices:

- exact camera default angle,
- exact top-bar logo placement,
- whether Papers and Guides panels should be routed pages or overlays,
- whether to bundle Three.js or import it from a CDN during early prototyping,
- how much city/town detail is optimal before performance or visual noise suffers,
- exact chart styling for the frontier,
- exact wording for risk-adjusted return in the UI.

## 30. Best current design statement

The homepage should open as a bright research website for **The Impact Frontier**, with a clean white top bar for logos and research navigation. Beneath it, users see a polished harbor-front lake economy: water in front, a curved shoreline, gently rising green terrain, boats, roads, trucks, low-rise town structures, and six investable entities along the waterfront. The user can ignore the game and open Papers or Guides, or click Play to open a compact left-side panel. The panel guides them to choose a goal, set 100 offer tokens, run the economy, and compare the result with the Impact Frontier. The economy stays visible throughout. The player learns that offers are not final capital, because the market response can amplify, redirect, or partially offset what they tried to fund.
