# Agent Challenge Prompt - Lake Economy Prototype

Use this prompt to ask an agent to create a blank-slate prototype or design concept.

## Prompt

You are helping build the front page for a research website connected to the Impact Frontier and Shifting the Frontier project.

Your task is to create a blank-slate prototype for an interactive homepage game called **Lake Economy**.

Read these files first:

```text
docs/lake-economy-game-brief.md
docs/paper1-short-context.md
docs/gatsby-aquaculture-context.md
docs/paper2-short-context.md
docs/implementation-notes.md
```

The core idea is simple:

```text
The player sets offers.
The lake economy clears.
The game shows what actually got funded.
The result is compared with an Impact Frontier.
```

Do not make a simple ESG ranking game. Do not let the player directly choose final firm capital. The player controls offer strengths. The economy responds.

## Product requirements

Build or design an MVP with:

- a charming lake economy visual,
- six investable entities,
- offer sliders or equivalent controls,
- two visible outcome meters: lake health and local prosperity,
- a player-selected blended objective,
- a deterministic **Run economy** action,
- a **Start fresh** action that clears offers but keeps the same lake,
- a **New lake** action that generates a new parameter set,
- a frontier chart or frontier score,
- a visible distinction between player offers and actual capital added.

The six investable entities are:

1. Scalable fish farm
2. Steady fish farm
3. Feed mill
4. Hatchery
5. Cold chain / market access
6. Lakefront industry

Other investors should be visible in the world, even if not interactive.

## Economic model requirements

Use a simple hidden response system:

```text
b_n >= 0
sum_n b_n = 100
Delta phi = alpha * b
Delta K = C * Delta phi
Delta X = g' Delta K
```

The player sees expected business payoff, risk, lake health intensity, and local prosperity intensity. The player should not initially see hidden responsiveness or contribution multipliers.

Use scenario templates rather than unrestricted random generation:

1. Feed bottleneck
2. Market access bottleneck
3. Scalable entrepreneur
4. Dirty growth trap

A run of the same lake with the same offers should be deterministic.

## Technical preferences

Preferred stack:

- React or Next.js,
- TypeScript,
- Three.js or React Three Fiber for the lake scene if useful,
- SVG, Canvas, or D3 for charts,
- no backend for MVP.

Keep model logic separate from visuals.

## Creative direction

Tone: charming, toy-like, serious enough for a research site.

Avoid:

- corporate dashboard blandness,
- childish moral cartoon,
- overcomplicated finance UI,
- hiding the papers behind the game,
- implying the player is an all-powerful planner.

The page should still make Paper 1 and Paper 2 easy to access.

## Deliverable options

Depending on the agent's abilities, produce one of the following:

1. A working prototype.
2. A high-fidelity design concept plus component plan.
3. A technical implementation plan with starter code.

The best response should prioritize a playable core loop over visual polish.

## Evaluation criteria

Your prototype will be judged on:

- whether it teaches the right idea,
- whether it feels charming and intuitive,
- whether the player can learn the hidden response system by experimenting,
- whether the model is economically coherent enough for a toy demo,
- whether the page still works as a research homepage,
- whether the code is lightweight and maintainable.
