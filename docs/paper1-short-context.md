# Paper 1 Short Context - The Impact Frontier

This note gives agents enough context from Paper 1 to build the homepage game without reading the full manuscript.

## One-sentence project idea

Paper 1 studies how a portfolio tilt changes firms' capital and external outcomes through an equilibrium supply-and-demand system.

## Core economic idea

An investor does not directly choose how much capital each firm uses. The investor shifts a capital-supply schedule. Firms demand capital. Other investors also supply capital. Market clearing determines firm capital, prices, investor positions, and outcome changes.

For the game, this means:

```text
The player sets offers.
The lake economy clears.
The game shows what actually got funded.
```

Do not describe the player as directly allocating final firm capital.

## Key terms for the game

### Offer

A player-controlled bid or supply shift toward an investable entity. In the UI, this can be represented by offer tokens, sliders, coins, or cards.

### Firm capital

The equilibrium amount of capital used by each entity after the economy clears. This may differ from the player's offers.

### Outcome intensity

The expected external outcome produced by an extra unit of firm capital. For the game, use two visible outcome intensities:

- lake health intensity,
- local prosperity intensity.

The player can choose a blended objective by setting an outcome-weight slider.

### Response system

The hidden system that maps offers into actual firm-capital changes. It reflects investor supply slopes, firm demand slopes, and cross-entity links.

### Impact Frontier

The best achievable trade-off between risk-adjusted return and expected outcome change, given the same rules and constraints as the player faces.

In the game, the frontier should be the playable constrained frontier, not the fully unconstrained analytical frontier from the paper.

## Minimal mathematical engine

Let `b` be the player's offer vector. In the MVP:

```text
b_n >= 0
sum_n b_n = 100
```

The game converts offers into a supply shift:

```text
Delta phi = alpha * b
```

The economy response is:

```text
Delta K = C * Delta phi
```

where:

- `Delta K` is the equilibrium change in firm capital,
- `C` is the hidden contribution multiplier matrix,
- `alpha` scales game units into economic units.

For a marginal version of the model:

```text
C = (Phi_S + Phi_D)^(-1) Phi_S
```

where:

- `Phi_S` is the aggregate supply slope matrix,
- `Phi_D` is the firm-demand slope matrix.

For the homepage game, the player can be non-marginal. In that case use a fixed internal player size, or use the Paper 2 extension described in `paper2-short-context.md`.

## Outcome calculation

Let:

```text
g_lake = lake health intensity vector
g_prosperity = local prosperity intensity vector
nu = player-selected weight on lake health
```

Then the blended outcome vector is:

```text
g = nu * g_lake + (1 - nu) * g_prosperity
```

The outcome change is:

```text
Delta X = g' Delta K
```

The UI can also show lake health and prosperity separately, even when the frontier score uses the blended objective.

## Financial cost

For the game, use a simple quadratic cost:

```text
L = 0.5 * b' A b
```

where `A` is the financial cost or risk matrix used in the playable game. It can be diagonal in the earliest MVP, then expanded to include payoff covariance.

The exact economic interpretation should stay light in the UI. The user can see expected payoff, risk, and frontier score without needing the full matrix.

## Frontier score

For the player's financial cost `L_player`, compute the best feasible outcome using the same constraints:

```text
b_n >= 0
sum_n b_n = 100
```

Then:

```text
frontier_score = player_outcome / best_outcome_at_same_cost
```

Display this as something like:

```text
You reached 72% of the frontier for this lake.
```

Keep the language concrete. Avoid implying moral failure when the score is low. The player is learning the system.

## Main teaching contrast

The game should let the player compare strategies such as:

- offer to the highest expected business payoff entity,
- offer to the highest raw outcome-intensity entity,
- spread offers equally,
- discover a response-adjusted offer pattern.

The lesson is not that financial payoff is bad or that high outcome intensity is bad. The lesson is that neither raw business payoff nor raw outcome intensity is enough. The response system matters.

## What to avoid

- Do not make this a simple "good firms versus bad firms" game.
- Do not tell the player they directly choose final capital allocation.
- Do not show the hidden contribution multipliers at the start.
- Do not make randomness occur inside a repeated run of the same lake.
- Do not require users to understand matrices before playing.
- Do not overbuild a full financial simulator for the homepage MVP.
