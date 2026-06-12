# Goals Guide Integration for the Lake Economy Game

## Purpose

This note defines how the Lake Economy game should connect to *The Investor's Guide to Goals-Based Investing and Philanthropy* without turning the game into a guide summary or adding too much explanation.

The game should remain simple: choose a goal, set offers, run the economy, and see whether the result is close to the Impact Frontier.

The guide connection should be natural and embedded in the interaction.

## Core guide links to include

### 1. Choose the goal first

Before the player sets offers, the game should ask:

> What are you trying to improve?

The player should choose one of three goal settings:

- Lake health
- Local prosperity
- Balanced

A simple slider can also work:

- 100% lake health
- 50/50 balanced
- 100% local prosperity

This is the cleanest connection to the guide. The guide's core message is that capital is a means, not an end. The player should therefore choose the goal before choosing the strategy.

Implementation note:

- The chosen goal defines the blended outcome vector used in the game.
- The Impact Frontier should be computed for that chosen goal.
- Changing the goal should change the relevant frontier.

Suggested UI language:

> First choose your goal. The same economy can look different depending on what you are trying to improve.

### 2. Use the Impact Frontier as a coherence check

After the player runs the economy, show the result on the Impact Frontier chart.

The chart should answer:

> Given your chosen goal, did your offers use capital efficiently?

Suggested result language:

> You reached 64% of the frontier for your chosen goal.

or:

> Your offers improved local prosperity, but they left impact on the table relative to the frontier.

This links to the guide's point that clear goals allow coherent strategy. The game makes that concrete: once the goal is chosen, the frontier checks whether the player's offers fit that goal.

Implementation note:

- Avoid saying the player's choice is morally right or wrong.
- The result is a coherence check, not a values judgment.
- The same offer vector may look strong for one goal and weak for another.

### 3. Include local perspective cards

The game should include short, optional perspective cards from people connected to the lake economy. These cards motivate the goal choice and make the outcome slider feel grounded rather than abstract.

Suggested intro:

> Local leaders have invited you to help finance the next stage of the lake economy. Before setting offers, choose what you are trying to improve.

Suggested perspective cards:

#### Fish farmers

Reliable feed and market access would help us produce more and earn steadier incomes.

#### Families

We need affordable local food and jobs that last.

#### Lake stewards

The lake supports the whole economy. Growth that damages the water will not last.

#### Entrepreneurs

Some businesses are ready to grow, but they need capital and a stronger local system around them.

#### Workers

New investment can create jobs, but the quality and stability of those jobs matter.

Design guidance:

- These should be short and visual.
- They should not become a lecture.
- They should support the player's choice of goal, not tell the player what to choose.
- They should be optional or lightly presented so the game stays fast.

## Success-state message

When the player gets close to the frontier, the game should congratulate them and point toward future layers of the project.

Suggested language:

> Strong result. You found a coherent capital-allocation strategy for this goal.
>
> Next step: learn more with local stakeholders and consider advanced strategies such as coalition building, stewardship, grants, and policy. Coming soon.

This connects the guide to Paper 2 without overloading the first version of the game.

## What not to do in the MVP

### Do not overuse the word “structure” in the game UI

The guide discusses structures, but the MVP game already creates a focused decision setting: one lake, one budget, one chosen goal, one response system.

Calling this a “structure” in the UI may feel like abstract terminology pasted onto the game.

Use the idea implicitly for now. The structure concept can become explicit later if the game adds:

- multiple lakes
- separate grant and investment budgets
- family goals
- personal financial goals
- philanthropic vehicles
- stewardship or policy instruments

### Do not make the goal choice too heavy

The goal choice should feel like the start of play, not a form to fill out.

Good:

> What are you trying to improve?

Avoid:

> Define your values vector and preferred impact structure.

### Do not imply that local perspectives mechanically determine the goal

The perspective cards should inform the player. They should not make the game claim that one goal is objectively correct.

The game should respect that different investors may choose different goals.

## Recommended placement in the project docs

Add this file beside the main game brief:

```text
docs/goals-guide-game-integration.md
```

Then update the agent context index to include:

```text
- goals-guide-game-integration.md: explains how the Lake Economy game should connect to The Investor's Guide to Goals-Based Investing and Philanthropy.
```

Then add one line to the agent challenge prompt:

```text
Use `goals-guide-game-integration.md` to include the goals-based-investing connection: goal choice before play, frontier as a coherence check, and light local perspective cards.
```

## Summary for agents

The game should connect to the guide in three ways:

1. The player chooses the goal before setting offers.
2. The Impact Frontier checks whether the player's offers fit that goal.
3. Local perspective cards make the goal choice concrete and open the path to advanced strategies.

The guide connection should be felt through the interaction, not explained as a separate lesson.
