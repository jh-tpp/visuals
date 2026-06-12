# Changelog - Version 0.2

## Updated after v3 prototype

### Product framing

- Reframed the project as a research homepage for **The Impact Frontier**, not a website titled "Lake Economy".
- Kept Lake Economy as the internal name for the interactive game/world.
- Added explicit top-bar guidance for TPP, CSP, HSG, Papers, Guides, Methods, and Play.

### Visual direction

- Replaced lake-in-the-center guidance with a harbor-front shoreline layout.
- Added requirements for non-trivial shoreline, boats, rising terrain, undulating ground, low-rise town, quays, roads, trucks, trees, and sensible ground under every structure.
- Added visual palette guidance: bright, white/off-white, grey, blue water, green terrain, realistic earth tones.
- Removed ambiguous spinning yellow objects from the visual direction.

### Interaction design

- Replaced full-screen step/modal flow with compact non-blocking Play panel.
- Specified that the economy should never be blurred, darkened, or grayed out during play.
- Added step gating: no default goal, Step 2 locked until Step 1, Step 3 locked until Run economy.
- Moved entity details out of permanent Play-panel subpanels and into click-to-open popups.

### Economic-result language

- Clarified actual capital as baseline-relative total capital change:

```text
K under current offers - K under equal-offer baseline
```

- Added guidance to split results into Offer, Total Delta K, Player Delta K, and Other investors Delta K.
- Clarified that negative Delta K means less capital than baseline, not a negative final firm size.

### Evaluation

- Expanded the scorecard to test research homepage fit, harbor-world direction, non-blocking interaction, step gating, popups, frontier clarity, and MVP discipline.
