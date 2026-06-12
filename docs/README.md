# Updated Lake Economy / Impact Frontier Homepage Docs

Version: 0.2 working docs  
Status: updated after the v3 working prototype

This bundle updates the most important Markdown files to reflect the latest agreed direction.

## Main changes

- The page is a research website first, not a site titled "Lake Economy".
- The visible site title should be **The Impact Frontier**.
- The top bar should support TPP, CSP, and HSG logos, plus Papers, Guides, Methods, and Play.
- The visual world should use a harbor-front lake economy, not a lake-in-the-center layout.
- The economy should remain visible during play. Avoid full-screen modals, dark overlays, blur, or graying out the scene.
- The Play panel should be compact and left-side.
- Step 1 starts with no goal selected. Step 2 and Step 3 are locked until the user completes the prior steps.
- Entity details should be popups near entities, not permanent subpanels inside Play.
- Offer changes should be shown with numeric bubbles and visual offer bars.
- Capital results should be labeled as baseline-relative capital changes.
- The R model remains the economic-engine reference.

## Files included

```text
README.md
agent-challenge-prompt.md
agent-context-index.md
gatsby-aquaculture-context.md
goals-guide-game-integration.md
implementation-notes.md
lake-economy-game-brief.md
paper1-short-context.md
paper2-short-context.md
prototype-evaluation-scorecard.md
lake_economy_model_prototype.R
```

## Recommended files to copy first

```text
lake-economy-game-brief.md
agent-challenge-prompt.md
implementation-notes.md
goals-guide-game-integration.md
prototype-evaluation-scorecard.md
agent-context-index.md
```

`gatsby-aquaculture-context.md` and `paper1-short-context.md` were also updated lightly so future agents do not regress to earlier visual or capital-language assumptions.
