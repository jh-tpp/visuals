# Prototype Evaluation Scorecard - Lake Economy Game

Use this scorecard to compare outputs from different agents.

Score each category from 1 to 5.

```text
1 = poor
2 = weak
3 = usable
4 = strong
5 = excellent
```

## 1. Core concept accuracy

Does the prototype understand the central idea?

A strong prototype makes clear that:

- the player sets offers,
- the economy clears,
- actual capital added differs from offers,
- outcomes depend on the response system,
- the result is compared with a frontier.

Score: ___ / 5

Notes:

## 2. Economic coherence

Does the toy model behave in a plausible way?

Check:

- deterministic runs for the same lake and offers,
- bounded and valid parameter sets,
- no broken frontier scoring,
- no nonsensical negative firm sizes in normal play,
- clear distinction between business payoff, risk, and outcome intensity.

Score: ___ / 5

Notes:

## 3. Learning experience

Can the player learn by experimenting?

A strong prototype lets the player discover that raw outcome intensity and expected business payoff are not enough.

Check:

- hidden response system can be inferred through runs,
- presets invite comparison,
- feedback is clear after each run,
- user can improve within the same lake.

Score: ___ / 5

Notes:

## 4. Visual charm and clarity

Does the lake economy feel engaging and legible?

Check:

- the world reads quickly,
- entities are visually distinct,
- style is charming but not childish,
- lake health and local prosperity are easy to see,
- frontier chart is visible without dominating everything.

Score: ___ / 5

Notes:

## 5. Homepage fit

Does the prototype work as the front page of a research site?

Check:

- Paper 1 and Paper 2 remain easy to access,
- page does not feel like a toy detached from the research,
- serious users can skip or minimize the game,
- visual load does not overwhelm the paper links.

Score: ___ / 5

Notes:

## 6. Technical quality

Is the code or implementation plan maintainable?

Check:

- model logic separate from visuals,
- simple state structure,
- no unnecessary backend,
- no fragile hard-coding where data structures would be better,
- clear path to add Paper 2 modules later.

Score: ___ / 5

Notes:

## 7. MVP discipline

Does the prototype avoid trying to do too much?

Check that it defers:

- coalition negotiation,
- policy cards,
- stewardship cards,
- borrowing,
- multi-period dynamics,
- noisy shocks inside repeated runs,
- excessive paper math.

Score: ___ / 5

Notes:

## Overall judgment

Total score: ___ / 35

Recommended action:

```text
[ ] Use as lead prototype
[ ] Borrow specific ideas
[ ] Needs major revision
[ ] Do not use
```

Most valuable idea to keep:

Biggest concern:

Next change to request:
