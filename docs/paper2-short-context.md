# Paper 2 Short Context - Shifting the Frontier

This note gives agents enough Paper 2 context to design future extensions without overcomplicating the homepage MVP.

## One-sentence project idea

Paper 2 asks how the Impact Frontier shifts when the actor is not just a small investor making a portfolio tilt, but a larger coalition, a government, or a steward acting through firm incentives.

## How this connects to the game

The MVP game should focus on the Paper 1 loop:

```text
set offers -> run economy -> observe response -> compare with frontier
```

Paper 2 should influence the design only by making sure the architecture can later support:

- investor size,
- coalitions,
- policy wedges,
- stewardship actions,
- changes to the response system itself.

Do not put all of this in the first playable homepage version.

## Coalition size

A larger investor or coalition can internalize more of the response it creates. In a benchmark version, coalition size `f` changes the response matrix:

```text
C(f) = (Phi_S + (1 - f) Phi_D)^(-1) Phi_S
```

where:

- `f = 0` corresponds to a marginal investor,
- `f = 1` corresponds to a fully coordinated investor side in the benchmark.

The important teaching point is:

```text
A larger coalition is not just a scaled-up small investor.
```

It may change which offers are most effective.

## Possible future player-size mode

After the MVP, add a size control:

```text
Small investor
Lead investor
Coalition
```

Changing this control should alter the response matrix and therefore the frontier.

The player should still not be the planner. Even as a coalition, the player works through the lake economy's response system.

## Policy and stewardship extensions

Paper 2 compares different instruments:

- investor offers shift capital supply,
- government wedges change financing or production incentives,
- stewardship changes firm behavior where governance authority is available.

In game terms:

### Investor offers

The player shifts supply toward investable entities.

### Policy

A public actor changes terms, such as subsidies, taxes, rules, or public guarantees. This can alter payoffs, costs, or firm-demand slopes.

### Stewardship

An owner or coalition asks a firm to change how it operates. This can change an outcome intensity, business payoff, risk, or scalability.

## Future extension examples

### Coalition mode

The player can invite other investors into a coalition. Each investor type may have different goals or constraints.

Possible investor types:

- local bank,
- family office,
- pension fund,
- public development fund,
- philanthropic funder.

### Stewardship card

The player can spend effort to improve one entity's outcome intensity or reduce its negative lake effect.

Example:

```text
Improve feed standards
```

Effect:

- feed mill lake intensity improves,
- fish farm productivity improves,
- financial cost or effort cost increases.

### Policy card

The game introduces a public actor or rule.

Example:

```text
Lake protection rule
```

Effect:

- lakefront industry becomes less damaging,
- operating payoff falls slightly,
- fish farms become more viable.

## Design principle

Paper 2 should not turn the game into "more centralization is always better". The point is subtler:

```text
Different instruments shift the frontier through different margins and costs.
```

The game should let users see that portfolio tilts, coalitions, stewardship, and policy are related but not interchangeable.

## MVP boundary

For the first build, defer:

- coalition negotiation,
- policy cards,
- stewardship cards,
- multi-round dynamics,
- endogenous firm strategy,
- strategic bargaining with other investors.

But code the model and UI in a way that can later support these modules.
