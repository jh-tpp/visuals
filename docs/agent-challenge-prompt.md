# Agent Challenge Prompt - Impact Frontier Homepage Prototype

Use this prompt to ask an agent to create or revise the working prototype.

## Prompt

You are helping build the front page for a research website connected to **The Impact Frontier** and **Shifting the Frontier** project.

The page is a research website first. The interactive economy is the homepage centerpiece, not the identity of the whole site. Do not make the page feel like it is called "Lake Economy". Use **The Impact Frontier** as the visible research-site title.

Your task is to build or revise a working prototype for an interactive harbor-front lake economy game embedded in the research homepage.

Read these files first:

```text
docs/lake-economy-game-brief.md
docs/paper1-short-context.md
docs/gatsby-aquaculture-context.md
docs/paper2-short-context.md
docs/implementation-notes.md
docs/goals-guide-game-integration.md
```

Also read:

```text
lake_economy_model_prototype.R
```

This R file is the tested economic-engine reference. Treat it as the current source of truth for the model structure and useful starting parameter values. Do not treat its plotting code as the website design.

## Core idea

The core idea is simple:

```text
The player sets offers.
The lake economy clears.
The game shows what actually got funded.
The result is compared with an Impact Frontier.
```

Do not make a simple ESG ranking game. Do not let the player directly choose final firm capital. The player controls offer strengths. The economy responds.

## Current visual direction

Use a harbor-front layout, not a lake-in-the-center layout.

The user should see:

- blue water in front,
- a non-trivial curved shoreline,
- green land rising gently from the shoreline to the back,
- slightly undulating terrain,
- low-rise town structures,
- all six investable entities arranged along one shoreline,
- boats like simple harbor or lake boats,
- roads, trucks, trees, quays, and ground detail.

The scene should feel brighter and cleaner than a dark environmental dashboard:

- white or off-white page background,
- white top bar,
- light grey or eggshell surrounding background,
- blue water,
- green terrain,
- realistic earth tones,
- no yellow/orange Harbor Town background,
- no somber dark-green styling.

Avoid ambiguous decorative objects. In particular, do not add spinning yellow markers or other elements whose meaning is unclear.

## Research homepage requirements

The top bar should feel like a research-site navigation bar.

Include placeholders for:

```text
TPP logo
CSP logo
HSG logo
The Impact Frontier
Papers
Guides
Methods
Play
```

Papers, Guides, and Methods should open large panels above the economy. The economy should remain visible behind them. Do not blur, darken, or gray out the economy.

The Play button should be simple and visible. A white Play button in the top-left or top bar is acceptable.

## Game UI requirements

The Play panel should be compact and non-blocking:

- left side,
- not full-screen,
- not centered over the economy,
- no dark overlay,
- no blurred or grayed-out economy,
- small enough that the user can still view and orbit the world.

Guide the user through three steps.

### Step 1 - Choose goal

Initial state:

- no goal selected,
- not Lake health,
- not Balanced,
- not Local prosperity.

The user must interact with Step 1 by clicking a button or moving the slider. Only then unlock Step 2.

### Step 2 - Set offers

Step 2 is greyed out until Step 1 is completed.

The player allocates 100 offer tokens across the six entities. The player must allocate all 100 tokens before Run economy is enabled.

Changing offers should update:

- numeric offer values above each entity,
- a visual offer bar beside each entity, ideally yellow filling to the right as the offer increases.

### Step 3 - Results and frontier

Step 3 is greyed out until Step 2 is completed and the user clicks **Run economy**.

After a run, show:

- player offers,
- total capital change versus baseline,
- player capital change versus baseline,
- other-investor capital change versus baseline,
- lake health change,
- local prosperity change,
- risk-adjusted return result,
- frontier score,
- frontier chart.

## Entity popup requirements

Do not show permanent entity-detail subpanels inside the Play panel.

Entity details should appear as contained popups near the relevant entity.

There should be two ways to open a popup:

1. click the entity in the 3D economy,
2. click the entity name or link in the offer list.

Popups should close when the user clicks outside them or clicks close.

Before a run, show only visible characteristics:

- expected business payoff,
- risk,
- lake health intensity,
- local prosperity intensity.

Do not initially show hidden responsiveness, contribution multipliers, or the exact response matrix.

## Six investable entities

Use exactly these six investable entities in the MVP:

1. Scalable fish farm
2. Steady fish farm
3. Feed mill
4. Hatchery
5. Cold chain / market access
6. Lakefront industry

Every investable entity needs a separate structure or area in the 3D economy, with sensible ground or site detail around it.

Other investors should be visible in the world, even if not interactive.

## Economic model requirements

Port the R model logic into the website stack.

The model should preserve the distinction between:

```text
player offers
player supply shift
total capital after clearing
player capital
other-investor capital
outcomes
risk-adjusted return
```

Use baseline-relative language for capital results:

```text
Actual capital change = K under current offers - K under equal-offer baseline
```

A negative capital change means the firm receives less total capital than under the equal-offer baseline. It does not mean the firm disappears.

Use scenario templates rather than unrestricted random generation:

1. Feed bottleneck
2. Market access bottleneck
3. Scalable entrepreneur
4. Dirty growth trap

A run of the same lake with the same offers should be deterministic.

## Chart convention

Use the project convention:

```text
x-axis: expected outcome change
y-axis: risk-adjusted return
```

The R file may compute CE values or CE loss internally. Convert this to a risk-adjusted-return framing for the UI where practical. Do not reverse the axes.

## Technical preferences

Preferred stack:

- React or Next.js,
- TypeScript,
- Three.js or React Three Fiber,
- SVG, Canvas, or D3 for charts,
- no backend for MVP.

Keep model logic separate from visuals.

For quick prototypes, vanilla JavaScript is acceptable if the files remain cleanly separated into model, scene, chart, and UI.

Do not implement coalition, policy, stewardship, time evolution, density controls, or multi-period modes in the MVP. Structure the model so these can be added later.

## Creative direction

Tone: charming, toy-like, serious enough for a research site.

Avoid:

- corporate dashboard blandness,
- childish moral cartoon,
- overcomplicated finance UI,
- hiding the papers behind the game,
- implying the player is an all-powerful planner,
- dark overlays over the economy,
- full-screen step modals,
- ambiguous decorative objects.

Public UI should say "inspired by real lake-economy and aquaculture cases", not "based on Gatsby". Gatsby context is for internal design grounding unless the user explicitly asks for a case note.

## Deliverable

Primary deliverable: a working playable prototype.

If a working prototype is impossible, produce a high-fidelity design concept and explain what prevented implementation. Do not stop at a plan unless explicitly instructed.

The best response should prioritize a playable core loop, a clean research-homepage frame, and a polished harbor-world direction over excessive feature count.

## Evaluation criteria

Your prototype will be judged on:

- whether it teaches the right idea,
- whether it uses the harbor-front layout well,
- whether the economy remains visible while playing,
- whether Papers and Guides remain easy to access,
- whether the player can learn the hidden response system by experimenting,
- whether the model is economically coherent enough for a toy demo,
- whether the code is lightweight and maintainable.
