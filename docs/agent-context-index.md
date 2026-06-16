# Agent Context Pack - Impact Frontier Homepage Game

Version: 0.2 working index  
Status: updated after the v3 working prototype

Purpose: provide compact, agent-ready context for building or revising the interactive homepage game for **The Impact Frontier** and **Shifting the Frontier** research website.

The interactive world is still called Lake Economy internally, but the website itself should not be framed as "Lake Economy". The visible homepage identity should be **The Impact Frontier**.

## Recommended reading order for agents

1. `lake-economy-game-brief.md` - canonical product and design source of truth.
2. `paper1-short-context.md` - core economic idea behind the first game mode.
3. `lake_economy_model_prototype.R` - tested economic-engine reference.
4. `implementation-notes.md` - practical build guidance.
5. `goals-guide-game-integration.md` - goal choice, frontier coherence check, and light local perspectives.
6. `gatsby-aquaculture-context.md` - real-world inspiration for the stylized economy.
7. `paper2-short-context.md` - future extensions: coalitions, stewardship, and policy.
8. `agent-challenge-prompt.md` - current challenge prompt for prototype agents.
9. `prototype-evaluation-scorecard.md` - how to compare prototype outputs.

## Current lead direction

The lead prototype direction is:

```text
A bright research homepage with a harbor-front 3D lake economy as the interactive centerpiece.
```

Key visual agreements:

- white or off-white research-site top bar,
- placeholders for TPP, CSP, and HSG logos,
- visible title: The Impact Frontier,
- top-level buttons for Papers, Guides, Methods, and Play,
- harbor-front layout rather than lake-in-the-center layout,
- non-trivial curved shoreline,
- boats on the water,
- green ground rising gently from the shoreline to the back,
- all six investable entities arranged along one shoreline,
- low-rise town background,
- compact non-blocking Play panel,
- no dark overlays or blurred economy,
- entity detail popups rather than permanent entity subpanels.

## What agents should understand

The homepage game is not an investment calculator and not a simple ESG score game. It is a small market-clearing toy economy.

The player sets offer strengths. Other investors and firms respond. Firm capital changes. Financial and external outcomes change. The player then sees how close the result is to the Impact Frontier.

The core distinction:

```text
Player offers != final capital allocation
```

That distinction should be visible in the UI and respected in the code.

## Current model reference

Use `lake_economy_model_prototype.R` for the economic engine.

The R model distinguishes:

- player offers,
- player supply shift,
- player capital,
- other-investor capital,
- total equilibrium capital,
- equilibrium price/return,
- lake health,
- local prosperity,
- risk-adjusted return / CE,
- approximate playable frontier.

For result language, use baseline-relative capital changes:

```text
Actual capital change = K under current offers - K under equal-offer baseline
```

Negative values are allowed if they mean less capital than the equal-offer baseline. They should not imply negative final firm size.

## Suggested repo layout

```text
docs/
  lake-economy-game-brief.md
  agent-context-index.md
  paper1-short-context.md
  paper2-short-context.md
  gatsby-aquaculture-context.md
  implementation-notes.md
  goals-guide-game-integration.md
  agent-challenge-prompt.md
  prototype-evaluation-scorecard.md
model-engine/
  lake_economy_model_prototype.R
```

If the website repo later needs paper PDFs, paper screenshots, guide thumbnails, or logos, place those in the website asset structure, not in this context folder. Agents generally need short context, not full source files.
