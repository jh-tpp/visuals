# Prototype Evaluation Scorecard - Impact Frontier Homepage Game

Version: 0.2 working scorecard  
Status: updated after the v3 working prototype

Use this scorecard to compare prototype outputs from different agents.

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
- the player does not directly choose final capital,
- the economy clears,
- actual capital change differs from offers,
- outcomes depend on the response system,
- other investors are present,
- the result is compared with a frontier.

Score: ___ / 5

Notes:

## 2. Research homepage fit

Does the prototype work as the front page of a research site?

A strong prototype:

- does not make the whole site feel titled "Lake Economy",
- uses **The Impact Frontier** as the visible research-site title,
- includes a clean top bar,
- leaves space for TPP, CSP, and HSG logos,
- keeps Papers and Guides easy to access,
- lets serious users skip or minimize the game,
- keeps research panels available without losing the scene.

Score: ___ / 5

Notes:

## 3. Harbor-world visual direction

Does the world follow the agreed visual direction?

A strong prototype has:

- harbor-front layout, not a circular lake-in-the-center layout,
- all businesses arranged along one shoreline,
- non-trivial shoreline rendering,
- water in front,
- green terrain rising gently from shore to back,
- slightly undulating land,
- sensible ground around every structure,
- boats that look like harbor or lake boats,
- low-rise town background,
- bright off-white or grey surroundings.

Avoids:

- dark-green somber styling,
- yellow/orange background from the reference demo,
- skyscraper city aesthetic,
- strange white/grey pads under structures,
- ambiguous spinning objects.

Score: ___ / 5

Notes:

## 4. Non-blocking interaction design

Does the UI let the user remain in the world while playing?

A strong prototype:

- keeps the economy visible at all times,
- does not blur, darken, or gray out the economy during play,
- avoids full-screen step modals,
- uses a compact Play panel,
- lets the user orbit or zoom while the Play panel is open,
- opens Papers, Guides, and Methods as panels rather than hiding the scene completely.

Score: ___ / 5

Notes:

## 5. Guided play flow

Does the prototype guide the first playthrough correctly?

Check:

- no goal selected by default,
- Step 2 greyed out until the user completes Step 1,
- Step 3 greyed out until offers are complete and Run economy is clicked,
- Run economy disabled until all 100 tokens are allocated,
- offer sliders remain available after a run,
- Start fresh keeps the same lake and clears offers,
- New lake generates a new scenario.

Score: ___ / 5

Notes:

## 6. Entity information design

Does the prototype handle entity details well?

A strong prototype:

- avoids permanent entity-detail subpanels in the Play panel,
- uses contained popups near the relevant entity,
- opens popups from both 3D entities and entity names in the offer list,
- closes popups when clicking outside or using close,
- shows only visible characteristics before a run,
- does not reveal hidden responsiveness too early.

Score: ___ / 5

Notes:

## 7. Economic coherence

Does the toy model behave in a plausible way?

Check:

- deterministic runs for the same lake and offers,
- bounded and valid parameter sets,
- no broken frontier scoring,
- no nonsensical negative final firm sizes in normal play,
- baseline-relative negative capital changes are explained correctly,
- clear distinction between business return, risk, outcome intensity, offers, player capital, other-investor capital, and total capital.

Score: ___ / 5

Notes:

## 8. Frontier and results clarity

Does the prototype use the project chart convention and explain results clearly?

Check:

- x-axis is expected outcome change,
- y-axis is risk-adjusted return,
- frontier is playable and constrained,
- result language uses "frontier score" or similar,
- capital result is labeled as baseline-relative,
- table can show Offer, Total Delta K, Player Delta K, and Other investors Delta K,
- negative capital changes are not presented as firm failure.

Score: ___ / 5

Notes:

## 9. Learning experience

Can the player learn by experimenting?

A strong prototype lets the player discover that raw outcome intensity and expected business return are not enough.

Check:

- hidden response system can be inferred through runs,
- presets invite comparison,
- feedback is clear after each run,
- user can improve within the same lake,
- visual offer indicators help the player connect choices to entities.

Score: ___ / 5

Notes:

## 10. Technical quality

Is the code maintainable?

Check:

- model logic separate from visuals,
- simple state structure,
- no unnecessary backend,
- no fragile hard-coding where data structures would be better,
- clear path to add Paper 2 modules later,
- Three.js scene does not contain economic logic,
- chart does not solve the economy.

Score: ___ / 5

Notes:

## 11. MVP discipline

Does the prototype avoid trying to do too much?

Check that it defers:

- coalition negotiation,
- policy cards,
- stewardship cards,
- borrowing,
- multi-period dynamics,
- time evolution,
- density controls,
- noisy shocks inside repeated runs,
- excessive paper math.

Score: ___ / 5

Notes:

## Overall judgment

Total score: ___ / 55

Recommended action:

```text
[ ] Use as lead prototype
[ ] Use as lead prototype after minor refinements
[ ] Borrow specific ideas
[ ] Needs major revision
[ ] Do not use
```

Most valuable idea to keep:

Biggest concern:

Next change to request:
