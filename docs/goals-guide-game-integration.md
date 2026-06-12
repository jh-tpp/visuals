# Goals Guide Integration for the Homepage Game

Version: 0.2 working note  
Status: updated after the v3 working prototype

## Purpose

This note defines how the interactive economy should connect to *The Investor's Guide to Goals-Based Investing and Philanthropy* without turning the game into a guide summary.

The game should remain simple:

```text
choose a goal -> set offers -> run the economy -> compare with the Impact Frontier
```

The guide connection should be felt through the interaction, not explained as a separate lesson.

## 1. Choose the goal first

Before the player sets offers, the game should ask:

> What are you trying to improve?

The player should choose one of three goal settings:

- Lake health
- Balanced
- Local prosperity

A slider can also work:

```text
Lake health <------> Local prosperity
```

Initial state:

- no option selected,
- not Lake health,
- not Balanced,
- not Local prosperity.

The user must interact with the goal control before the offer controls unlock.

This is the cleanest connection to the guide. The guide's core message is that capital is a means, not an end. The player should therefore choose the goal before choosing the strategy.

Implementation note:

- The chosen goal defines the blended outcome vector used in the game.
- The Impact Frontier should be computed for that chosen goal.
- Changing the goal should change the relevant frontier.
- Step 2 should remain greyed out until Step 1 is completed.

Suggested UI language:

> First choose your goal. The same economy can look different depending on what you are trying to improve.

## 2. Use the Impact Frontier as a coherence check

After the player runs the economy, show the result on the Impact Frontier chart.

The chart should answer:

> Given your chosen goal, did your offers use capital efficiently?

Suggested result language:

> You reached 64% of the frontier for your chosen goal.

or:

> Your offers improved local prosperity, but they left impact on the table relative to the frontier.

This links to the guide's point that clear goals allow coherent strategy. The game makes that concrete: once the goal is chosen, the frontier checks whether the player's offers fit that goal.

Implementation note:

- Step 3 should remain greyed out until Run economy has been clicked.
- Avoid saying the player's choice is morally right or wrong.
- The result is a coherence check, not a values judgment.
- The same offer vector may look strong for one goal and weak for another.

## 3. Keep local perspectives optional and light

The game can include short local perspective cards from people connected to the economy. These cards should motivate the goal choice and make the outcome slider feel grounded rather than abstract.

They should not dominate the opening view.

Good placement:

- optional disclosure in Step 1,
- small expandable row,
- short popover,
- lightweight card carousel only if it does not block the economy.

Avoid making these cards large by default.

Suggested intro:

> Local leaders have invited you to help finance the next stage of the lake economy. Before setting offers, choose what you are trying to improve.

Suggested perspective cards:

### Fish farmers

Reliable feed and market access would help us produce more and earn steadier incomes.

### Families

We need affordable local food and jobs that last.

### Lake stewards

The lake supports the whole economy. Growth that damages the water will not last.

### Entrepreneurs

Some businesses are ready to grow, but they need capital and a stronger local system around them.

### Workers

New investment can create jobs, but the quality and stability of those jobs matter.

Design guidance:

- Keep cards short.
- Make them optional.
- Do not turn them into a lecture.
- Do not imply local perspectives mechanically determine the goal.
- Do not tell the player which goal is correct.

## 4. Keep the economy visible

Goal choice and guide connection should not lock the user out of the economy view.

Avoid:

- full-screen goal modals,
- centered step overlays,
- dark masks,
- blurred or grayed-out economy views.

The Play panel can guide the user, but the harbor economy should remain visible and interactive.

## 5. Success-state message

When the player gets close to the frontier, congratulate them and point toward future layers of the project.

Suggested language:

> Strong result. You found a coherent capital-allocation strategy for this goal.
>
> Next step: learn more with local stakeholders and consider advanced strategies such as coalition building, stewardship, grants, and policy. Coming soon.

This connects the guide to Paper 2 without overloading the first version of the game.

## 6. What not to do in the MVP

### Do not overuse the word "structure" in the game UI

The guide discusses structures, but the MVP game already creates a focused decision setting: one economy, one budget, one chosen goal, one response system.

Calling this a "structure" in the UI may feel like abstract terminology pasted onto the game.

Use the idea implicitly for now. The structure concept can become explicit later if the game adds:

- multiple lakes or regions,
- separate grant and investment budgets,
- family goals,
- personal financial goals,
- philanthropic vehicles,
- stewardship or policy instruments.

### Do not make the goal choice too heavy

The goal choice should feel like the start of play, not a form to fill out.

Good:

> What are you trying to improve?

Avoid:

> Define your values vector and preferred impact structure.

### Do not imply that local perspectives decide the goal

The perspective cards should inform the player. They should not make the game claim that one goal is objectively correct.

The game should respect that different investors may choose different goals.

## Summary for agents

The game should connect to the guide in three ways:

1. The player chooses the goal before setting offers.
2. The Impact Frontier checks whether the player's offers fit that goal.
3. Local perspective cards make the goal choice concrete without taking over the screen.

The guide connection should be embedded in the interaction, not added as an explanatory essay.
