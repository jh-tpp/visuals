# Agent Context Pack - Lake Economy Homepage Game

Purpose: provide compact, agent-ready context for building the interactive homepage game for the Impact Frontier / Shifting the Frontier website.

This folder is meant to sit beside the canonical game brief:

```text
docs/lake-economy-game-brief.md
```

The canonical brief is the source of truth for the product idea. The files here give agents the surrounding project context, so they can build without reading full academic papers.

## Recommended reading order for agents

1. `lake-economy-game-brief.md` - product and design source of truth.
2. `paper1-short-context.md` - the economic idea behind the first game mode.
3. `gatsby-aquaculture-context.md` - why the game world is a lake economy.
4. `paper2-short-context.md` - future extensions: coalitions, stewardship, and policy.
5. `implementation-notes.md` - practical build guidance.
6. `agent-challenge-prompt.md` - challenge prompt for prototype agents.
7. `prototype-evaluation-scorecard.md` - how to compare prototype outputs.

## What agents should understand

The homepage game is not an investment calculator and not a simple ESG score game. It is a small market-clearing toy economy. The player sets offer strengths. Other investors and firms respond. Firm capital changes. Financial and external outcomes change. The player then sees how close the result is to the Impact Frontier.

The core distinction:

```text
Player offers != final capital allocation
```

That distinction should be visible in the UI and respected in the code.

## Suggested repo layout

```text
docs/
  lake-economy-game-brief.md
  agent-context-index.md
  paper1-short-context.md
  paper2-short-context.md
  gatsby-aquaculture-context.md
  implementation-notes.md
  agent-challenge-prompt.md
  prototype-evaluation-scorecard.md
```

If the website repo later needs paper PDFs or thumbnails, place those in the website asset structure, not in this context folder. Agents generally need short context, not full source files.
