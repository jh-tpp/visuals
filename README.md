# Visuals

This repository contains interactive visualization prototypes related to economic systems, portfolio structure, and capital allocation.

The current prototype is a browser-based visual tool that shows how an investor's allocation across firms can propagate through a simplified system. It is meant to make system structure visible without requiring readers to understand the underlying matrices or equations.

## Current prototype

The active homepage route is `app/page.tsx`, which renders
`components/lake-economy/LakeEconomyHome.jsx`. The homepage panels for
About, Papers, and Guide are currently generated inside
`components/lake-economy/runtime.js`, with their visual styling in
`components/lake-economy/lake-economy.css`.

Do not update unused standalone panel components when changing homepage
content. Before editing a page or component, search for imports/references and
confirm that the code is on the active render path. If an inactive duplicate is
kept for reference, move it under `archive/` and label it as inactive rather
than leaving it in `components/`.

The current visualization includes the following stages:

- Investor
- Change in supply of capital
- Price pressure
- Equilibrium firm size
- Equilibrium returns
- Aggregate outcomes

Users can reallocate a fixed total supply weight across firms and compare two views:

- **System aware** - cross-firm interactions are shown
- **Naive** - only same-firm paths are shown

## Status

This is an evolving project, not a finished software product. This repository currently contains prototype code. The prototype is interactive and intended for exploration, discussion, and iteration.

The formulas, visuals, controls, and structure may change substantially over time. Some parts are placeholders or simplified implementations used to support experimentation.
