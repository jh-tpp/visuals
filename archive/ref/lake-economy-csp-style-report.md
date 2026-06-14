# Lake Economy website - CSP style alignment and user experience report

Prepared for Jonathan Harris  
Date: 13 June 2026

## Executive recommendation

Keep the site as a distinct research microsite, not a copied CSP page. The strongest direction is:

> A serious, editorial research wrapper around a charming playable model.

The lake scene should remain the visual centerpiece. The CSP alignment should happen through color, typography, content hierarchy, button language, panel design, and light collaboration signals. Do not put the CSP logo in the top banner until you have explicit approval. Use a text-only collaboration strip in the About panel first.

The site should optimize for three actions, in this order:

1. **Play the model** - for nontechnical visitors and people who will not read the papers.
2. **Read or download the research** - for academics, senior investors, and technical readers.
3. **Contact Jonathan** - for people who want to discuss research, teaching, strategy, or collaboration.

The top-level design should make all three actions visible without making the page feel like a sales funnel.

## Sources reviewed

### CSP sources

- CSP homepage: `https://www.cspglobal.org/`
- CSP approach page: `https://www.cspglobal.org/about/approach`
- CSP publications page: `https://www.cspglobal.org/research/publications`
- CSP guide page: `https://www.cspglobal.org/research/publications/investors-guide-goals-based-investing-and-philanthropy`
- Uploaded CSP screenshots: `csp screenshots.zip`

### Lake Economy sources

- Live site: `https://visuals-three.vercel.app/`
- Uploaded source bundle: `lake tpp site.zip`
- Saved HTML: `The Impact Frontier.html`
- Current screenshots: `Screenshot 2026-06-13 at 16.54.46.png` and `Screenshot 2026-06-13 at 16.54.57.png`
- Key source files reviewed:
  - `components/lake-economy/LakeEconomyHome.jsx`
  - `components/lake-economy/lake-economy.css`
  - `components/lake-economy/runtime.js`
  - `components/lake-economy/scene.js`
  - `components/lake-economy/economy.js`

## One important limitation

I could browse the public CSP pages and inspect your uploaded screenshots and source files. I could not recover an official CSP brand guide or exact production CSS tokens from the public site. The color values below are therefore screenshot-derived approximations, not official CSP brand values.

That is fine for now. Use them as a working palette until CSP gives you official assets.

## CSP style read

### What CSP visually communicates

The CSP site is trying to feel:

- credible,
- institutional,
- editorial,
- human,
- networked,
- academically grounded,
- action-oriented but not e-commerce-like.

The public site uses a classic nonprofit or institute pattern: large editorial headings, high whitespace, a small number of strong CTAs, human photos, research cards, and a persistent path to schedule a call.

### Main CSP style ingredients

From the screenshots and pages, the key ingredients are:

1. **Editorial serif headings**  
   CSP page titles use a large, high-contrast serif. This is the biggest missing ingredient in the Lake Economy site today.

2. **Sans-serif navigation and body copy**  
   Nav, buttons, labels, metadata, and body text use a clean sans-serif.

3. **Very light warm background**  
   The background is close to warm white, not cold app-white.

4. **Deep navy or indigo CTA buttons**  
   CSP's strongest repeated action color is a deep blue-purple around `#29285f`.

5. **Deep teal institutional panels**  
   CSP uses a dark teal around `#183f4d` or `#184050`, especially in testimonial or impact sections.

6. **Research-card structure**  
   Publications appear as editorial cards with a category label, title, short description, and image.

7. **Human trust signals**  
   CSP uses portraits, quotes, alumni/community language, and author rows. Your site does not need to force this, but it should include at least authorship and collaboration signals.

8. **Clear contact route**  
   CSP consistently offers a schedule-call CTA. Your site should adapt this, not copy it directly.

## Current Lake Economy site read

### What is already strong

The lake scene is the asset. It is distinctive, memorable, and clearly not a generic academic webpage. It makes the research feel alive.

The current interaction also fits the project: visitors can choose a goal, set offers, run the economy, and see that offers differ from actual capital changes. That core idea should remain central.

### What currently feels less aligned with CSP

1. **The typography feels more like a Vercel demo than a CSP-adjacent research site**  
   The current CSS loads Geist via Next but the Lake Economy root overrides the font stack with `Inter, ui-sans-serif, system-ui...`. There is no editorial serif moment.

2. **The top bar feels like a software app**  
   The floating glass pill is attractive, but it reads more like a prototype UI than an institute research page.

3. **The welcome message is too generic**  
   `Welcome` does not tell visitors what they are looking at or why it matters.

4. **The Play button is visually orphaned**  
   A floating `Play` pill on the left feels disconnected from the main story. It should either live in the top bar or become a prominent welcome-panel action.

5. **The CTA path is incomplete**  
   There is no clear way to contact you, email you, or book a meeting.

6. **The guide panel is functionally useful but not editorial enough**  
   The guide cover dominates the panel. CSP's own guide page uses a more balanced hero layout: cover on the left, large title and CTA on the right, author row below.

7. **The color system is close but not CSP-like enough**  
   Current key colors include `#236a7a`, `#20342b`, `#d0a13a`, and warm paper tones. These are attractive, but the primary action green `#20342b` should move closer to CSP's deep indigo.

## Recommended positioning

Use this as the site's underlying concept:

> The Impact Frontier is research you can play with. The Lake Economy is a stylized model that lets visitors test how capital-market choices affect financial results and real outcomes through a response system.

This does three things at once:

- It makes the game legitimate.
- It makes the papers easy to find.
- It explains why the website is more than a portfolio of PDFs.

## Recommended information architecture

### Top bar

Use this order:

1. Logo or wordmark
2. Site title and subtitle
3. About
4. Papers
5. Guide
6. Play model
7. Discuss the work

`Discuss this work` should be the primary contact CTA. It is softer than `Schedule a call`, but still gives people a clear next step.

Recommended labels:

- `About`
- `Papers`
- `Guide`
- `Play model`
- `Discuss this work`

Use `Guide`, singular, unless you plan to add multiple guide pages soon. It is clearer.

### Panels

Use four panels or routes:

1. **About**  
   What this is, who it is for, collaboration context, contact.

2. **Papers**  
   Paper 1 and Paper 2 with SSRN links, previews, abstracts, and status.

3. **Guide**  
   The goals-based investing guide with a CSP landing-page CTA.

4. **Play model**  
   Opens or focuses the game controls.

A separate Contact panel is optional. I would not add it yet. Put contact in the top CTA and About panel.

## Recommended visual system

### Use this working color palette

These values are practical approximations based on the CSP screenshots, tuned to work with your lake scene.

```css
:root {
  /* CSP-adjacent core */
  --csp-paper: #fbf8f7;
  --csp-paper-strong: #fffdfb;
  --csp-ink: #181827;
  --csp-muted: #62636f;
  --csp-line: rgba(24, 24, 39, 0.15);
  --csp-line-strong: rgba(24, 24, 39, 0.28);

  /* Screenshot-derived CSP accents */
  --csp-indigo: #29285f;
  --csp-indigo-dark: #20204a;
  --csp-deep-teal: #183f4d;
  --csp-teal: #44747a;

  /* Lake Economy supporting colors */
  --lake-gold: #c79a38;
  --lake-gold-soft: #fff0bf;
  --lake-green: #4f8f61;
  --lake-red: #b46658;

  /* Existing variables mapped into the new system */
  --paper: rgba(251, 248, 247, 0.92);
  --paper-strong: rgba(255, 253, 251, 0.97);
  --ink: var(--csp-ink);
  --muted: var(--csp-muted);
  --line: var(--csp-line);
  --line-strong: var(--csp-line-strong);
  --accent: var(--csp-indigo);
  --accent-2: var(--csp-teal);
  --green: var(--lake-green);
  --red: var(--lake-red);
  --gold: var(--lake-gold);
  --cream: #fbf7f4;
  --shadow: 0 18px 54px rgba(24, 24, 39, 0.12);
}
```

### What each color should do

- Use `#29285f` for primary CTAs, active nav pills, SSRN buttons, CSP guide CTA, and contact buttons.
- Use `#183f4d` for institutional notes, method callouts, or About-panel highlights.
- Use `#44747a` for secondary accents and the welcome heading if you want a softer look.
- Keep gold for offer tokens, game feedback, and the current-result marker.
- Keep lake water colors mostly as they are. Do not force the 3D world into CSP colors.

### Main color change to make immediately

Replace this current action color:

```css
#20342b
```

with:

```css
#29285f
```

Use `#183f4d` only where a green-teal institutional tone is better than a CTA tone.

## Recommended typography

### Add an editorial serif for headings

The current site needs one strong editorial serif. Do not use CSP's exact font unless they provide it. Use a high-quality open font that gets close.

Recommended: **Source Serif 4** for large headings and panel titles.

In `app/layout.tsx`, replace the current font setup with something like this:

```tsx
import type { Metadata } from "next";
import { Inter, Source_Serif_4, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/components/lake-economy/lake-economy.css";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Impact Frontier",
  description: "Interactive research on the impact of capital market systems",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
```

Then in `lake-economy.css`:

```css
.lake-economy-root {
  font-family: var(--font-body), Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: var(--ink);
  background: var(--csp-paper);
}

.welcome-panel h1,
.content-header h2,
.research-card h3,
.method-copy h3,
.about-lede h3,
.contact-card h3 {
  font-family: var(--font-serif), Georgia, "Times New Roman", serif;
  font-weight: 500;
  letter-spacing: -0.045em;
}
```

### Where to use the serif

Use serif for:

- welcome-panel headline,
- content-panel title,
- paper titles,
- guide title,
- About-panel lead heading.

Keep sans-serif for:

- navigation,
- buttons,
- labels,
- game controls,
- entity cards,
- tables,
- chart labels.

This combination will align much more closely with CSP while keeping the game legible.

## Header recommendation

### Current issue

The current header is clean but too app-like. The rounded glass bar, isolated `Play` pill, and `Drag to orbit` text make the first impression feel like a demo rather than a research site.

### Recommended direction

Keep the white top banner, but make it more editorial and less glassy.

Specific changes:

1. Reduce transparency.
2. Reduce shadow.
3. Use CSP indigo for the active state.
4. Move `Play` into the top bar or make the welcome-panel CTA open the play panel.
5. Move `Drag to orbit - scroll to zoom` out of the top bar.
6. Add a contact CTA.

### Recommended header markup

Use this as the conceptual target:

```jsx
<header className="topbar" aria-label="Research navigation">
  <Link className="logo-link" href="/" aria-label="Total Portfolio Project home">
    <img src="/TPP.png" alt="Total Portfolio Project" />
  </Link>

  <div className="brand-block">
    <strong>The Impact Frontier</strong>
    <span>Research and tools for investor impact</span>
  </div>

  <nav className="top-nav" aria-label="Research panels">
    <button type="button" data-panel="about">About</button>
    <button type="button" data-panel="papers">Papers</button>
    <button type="button" data-panel="guides">Guide</button>
    <button type="button" id="topPlayButton">Play model</button>
  </nav>

  <a className="top-cta" href="YOUR_BOOKING_LINK" target="_blank" rel="noopener noreferrer">
    Discuss the work
  </a>
</header>
```

If you do not want the top CTA to open a booking link yet, make it a mailto link:

```html
<a class="top-cta" href="mailto:YOUR_EMAIL">Discuss the work</a>
```

### Recommended header CSS

```css
.topbar {
  height: 64px;
  padding: 8px 12px;
  border: 1px solid rgba(24, 24, 39, 0.12);
  border-radius: 18px;
  background: rgba(255, 253, 251, 0.94);
  box-shadow: 0 14px 38px rgba(24, 24, 39, 0.10);
  backdrop-filter: blur(10px) saturate(1.05);
  -webkit-backdrop-filter: blur(10px) saturate(1.05);
}

.top-nav button.active,
.top-cta,
.primary-action,
a.research-action {
  background: var(--csp-indigo);
  color: #fffdfb;
  border-color: transparent;
}

.top-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  min-height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 780;
  text-decoration: none;
  box-shadow: 0 12px 28px rgba(41, 40, 95, 0.16);
}

.top-cta:hover {
  background: var(--csp-indigo-dark);
  transform: translateY(-1px);
}
```

### What to do with the `Drag to orbit` text

Do not put it in the top bar. Put it in a small corner chip near the canvas:

```html
<div className="scene-help">Drag to orbit · scroll to zoom</div>
```

```css
.scene-help {
  position: fixed;
  right: 22px;
  bottom: 18px;
  z-index: 15;
  padding: 7px 10px;
  border-radius: 999px;
  background: rgba(255, 253, 251, 0.76);
  border: 1px solid var(--line);
  color: var(--muted);
  font-size: 11px;
  pointer-events: none;
}
```

## Welcome panel recommendation

### Current issue

The current welcome panel says:

> Welcome

That is too generic. It wastes the first impression.

### Recommended headline

Use this:

> A playable model of capital, markets, and real outcomes.

### Recommended subcopy

Use this:

> Set offers in a stylized lake economy. The economy clears. Compare the result with the Impact Frontier.

### Recommended CTA row

Use three actions:

- `Play the model` - primary
- `Read the papers` - secondary
- `Open the guide` - secondary

### Recommended JSX

```jsx
<section id="welcomePanel" className="welcome-panel" aria-label="Welcome">
  <span className="eyebrow">Total Portfolio Project research</span>
  <h1>A playable model of capital, markets, and real outcomes.</h1>
  <p>
    Set offers in a stylized lake economy. The economy clears. Compare the result with the Impact Frontier.
  </p>
  <div className="welcome-actions">
    <button id="welcomePlay" type="button" className="primary-action">Play the model</button>
    <button type="button" className="secondary-action" data-panel="papers">Read the papers</button>
    <button type="button" className="secondary-action" data-panel="guides">Open the guide</button>
  </div>
</section>
```

### Recommended welcome CSS

```css
.welcome-panel {
  width: min(760px, calc(100vw - 36px));
  padding: 30px 34px 28px;
  text-align: left;
  border-radius: 22px;
  background: rgba(255, 253, 251, 0.90);
  border: 1px solid rgba(24, 24, 39, 0.12);
  box-shadow: 0 24px 70px rgba(24, 24, 39, 0.13);
}

.welcome-panel h1 {
  max-width: 680px;
  color: var(--csp-ink);
  margin: 8px 0 12px;
  font-size: clamp(38px, 5vw, 62px);
  line-height: 0.98;
}

.welcome-panel p {
  width: min(100%, 600px);
  margin: 0;
  color: #3f4350;
  font-size: 16px;
  line-height: 1.55;
}

.welcome-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.secondary-action {
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.72);
  color: var(--ink);
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 780;
  cursor: pointer;
}
```

This will make the first impression much more credible.

## Content panel recommendation

### General panel style

The content panels should feel less like modal overlays and more like editorial pages sitting above the model.

Specific changes:

- Use a warmer off-white panel background.
- Reduce the glass effect.
- Use serif titles.
- Make cards less rounded.
- Make CTAs deep indigo.
- Add more editorial hierarchy.

Recommended CSS changes:

```css
.content-card {
  width: min(1080px, calc(100vw - 36px));
  border-radius: 18px;
  background: rgba(255, 253, 251, 0.96);
  box-shadow: 0 30px 90px rgba(24, 24, 39, 0.18);
}

.content-header {
  padding: 22px 26px 16px;
  background: rgba(255, 253, 251, 0.98);
}

.content-header h2 {
  font-size: clamp(34px, 4vw, 56px);
  line-height: 1;
  color: var(--csp-ink);
}

.research-card,
.method-copy,
.html-slot {
  border-radius: 14px;
  background: #fffdfb;
  border: 1px solid var(--line);
}
```

## About panel recommendation

### What About should do

The About panel should answer four questions quickly:

1. What is this?
2. Why does the game exist?
3. Who is behind it?
4. How can someone contact you?

### Recommended About copy

```html
<section class="about-layout">
  <article class="about-lede">
    <span class="eyebrow">What this is</span>
    <h3>Research you can play with.</h3>
    <p>
      The Impact Frontier studies how capital-market choices affect real outcomes through the way firms, prices, and other investors respond. The Lake Economy turns that idea into a small playable model.
    </p>
    <p>
      You set offers. The economy clears. The result shows what actually got funded, how lake health and local prosperity changed, and how close the strategy came to the frontier.
    </p>
  </article>

  <article class="about-card">
    <span class="eyebrow">Project</span>
    <h3>The Lake Economy</h3>
    <p>
      The demo is stylized. It is not a forecast or a calibrated policy model. It is a way to make the research intuition visible: impact depends on the response system, not just raw scores or expected payoff.
    </p>
  </article>

  <article class="about-card collaboration-card">
    <span class="eyebrow">Collaboration</span>
    <h3>Connected research and practitioner work</h3>
    <p>
      This work is connected to research and guide materials developed with CSP, MIT Sloan Sustainability Initiative, the University of St.Gallen, and Impact Frontiers.
    </p>
    <div class="text-logo-row" aria-label="Collaborating organizations">
      <span>CSP</span>
      <span>MIT Sloan</span>
      <span>University of St.Gallen</span>
      <span>Impact Frontiers</span>
    </div>
  </article>

  <article class="about-card contact-card">
    <span class="eyebrow">Contact</span>
    <h3>Discuss the work</h3>
    <p>
      For research, teaching, investment strategy, or collaboration conversations, contact Jonathan Harris.
    </p>
    <div class="contact-actions">
      <a class="research-action" href="mailto:YOUR_EMAIL">Email Jonathan</a>
      <a class="research-action secondary-link" href="YOUR_BOOKING_LINK" target="_blank" rel="noopener noreferrer">Book a meeting</a>
    </div>
  </article>
</section>
```

### Logo policy for About

Use the text-only row first. Once CSP approves logo use, replace the text row with official logos.

Do not use the CSP logo in the top banner until you have permission and alignment from CSP leadership.

## Papers panel recommendation

### What Papers should do

The Papers panel is for serious technical readers. It needs to feel credible immediately.

Recommended structure:

- Short intro: `Working papers behind the model.`
- Paper 1 card with title, 2-sentence abstract, status, SSRN CTA.
- Paper 2 card with title, 2-sentence abstract, status, SSRN CTA.
- Preview PDFs or thumbnails below, not as the dominant visual.

### Recommended copy

Paper 1:

> **The Impact Frontier**  
> How portfolio tilts move capital, returns, and external outcomes through an equilibrium response system. The Lake Economy game is a stylized front-end version of this idea.

CTA:

> Open on SSRN

Paper 2:

> **Shifting the Frontier**  
> How larger coalitions, policy, stewardship, and other instruments can change the response system itself, not just move along a fixed frontier.

CTA:

> Open on SSRN

If SSRN links are not live yet, use:

> SSRN link coming soon

Do not use disabled buttons for too long. Disabled CTAs make the page feel unfinished. If links are not live, offer `Preview paper` and a small status note.

## Guide panel recommendation

### Current issue

The current guide panel is useful but too large and flat. The giant cover preview eats the panel.

### Recommended layout

Use a CSP-like split hero:

- guide cover on the left,
- title and CTA on the right,
- short note below,
- optional author/collaborator row.

### Recommended CTA label

Use:

> Open guide on CSP

This is more accurate than `Download from CSP`, because your current link points to the CSP landing page rather than a direct file download. It also supports the goal of sending users through the CSP site.

### Recommended Guide HTML

```html
<section class="guide-hero-card">
  <img class="guide-cover-small" src="/guides/ig-goals-cover.jpg" alt="Investor's Guide to Goals-based Investing and Philanthropy cover">
  <div class="guide-copy">
    <span class="eyebrow">Investor's guide</span>
    <h3>Goals-based investing and philanthropy</h3>
    <p>
      A practical starting point for turning clear goals into coherent strategies across your portfolio.
    </p>
    <a class="research-action" href="https://www.cspglobal.org/research/publications/investors-guide-goals-based-investing-and-philanthropy" target="_blank" rel="noopener noreferrer">
      Open guide on CSP
    </a>
  </div>
</section>
```

### Recommended Guide CSS

```css
.guide-hero-card {
  display: grid;
  grid-template-columns: minmax(160px, 240px) 1fr;
  gap: clamp(24px, 5vw, 64px);
  align-items: center;
  padding: clamp(24px, 5vw, 56px);
  border: 1px solid var(--line);
  border-radius: 16px;
  background: #fffdfb;
}

.guide-cover-small {
  width: 100%;
  max-width: 240px;
  border: 1px solid var(--line);
  box-shadow: 0 18px 40px rgba(24, 24, 39, 0.12);
}

.guide-copy h3 {
  max-width: 680px;
  margin: 8px 0 14px;
  font-family: var(--font-serif), Georgia, serif;
  font-size: clamp(38px, 5vw, 72px);
  line-height: 0.98;
  font-weight: 500;
  letter-spacing: -0.045em;
}

@media (max-width: 760px) {
  .guide-hero-card {
    grid-template-columns: 1fr;
  }
}
```

## Contact and conversion strategy

### The goal

You are not selling a product. You are giving people a clear next step if the work is relevant to them.

Use this framing:

> Discuss the work

not:

> Buy now

or:

> Schedule a sales call

### Recommended contact locations

1. **Top bar**  
   Persistent CTA: `Discuss the work`.

2. **Welcome panel**  
   Do not lead with contact. Lead with `Play the model` and `Read the papers`.

3. **About panel**  
   Add a clear contact card with both email and meeting link.

4. **After a strong game result**  
   Add a subtle link:

   > Want to discuss how this applies to real capital allocation? Contact Jonathan.

Do not put contact prompts everywhere. One persistent top CTA and one About-panel contact card are enough.

## Logo and affiliation policy

### Stage 1 - now

Use only the TPP identity in the top banner. In the About panel, use text-only collaboration language:

> Connected research and practitioner work with CSP, MIT Sloan Sustainability Initiative, the University of St.Gallen, and Impact Frontiers.

This is safe and modest.

### Stage 2 - after permission

Add official organization logos inside the About panel and Guide panel only.

Use a label like:

> Collaborating organizations

or:

> Related research and practitioner partners

Avoid saying `official CSP project` unless CSP explicitly approves that wording.

### Stage 3 - only if CSP wants stronger ownership

Add the CSP logo or `in collaboration with CSP` in the top banner. Place it on the right side or in a small affiliation strip, not as a replacement for the Total Portfolio Project identity.

## Game UI recommendations

### Keep the game visually dominant

The lake scene is the reason the site works. Do not shrink it into a conventional homepage.

### Rename remaining `harbor` language

The source still uses `harbor` in several places. The project is Lake Economy. Rename all user-facing references:

- `harbor economy` to `lake economy`
- `this harbor` to `this lake`
- `Clear this harbor economy` to `Clear this lake economy`
- seed names from `harbor-2025-a` to something like `lake-2026-a`

This matters because the lake is conceptually tied to the research story.

### Make Play easier to start

The current Play button is easy to miss. Add a primary `Play the model` CTA in the welcome panel.

Recommended behavior:

- `Play the model` hides the welcome panel.
- It opens the play panel.
- It keeps the current camera view.

### Use one phrase consistently

Use this phrase everywhere:

> The economy clears.

Avoid switching between `market clears`, `harbor clears`, and `cleared result` too much. Consistent language helps nontechnical visitors.

### Keep the offer/capital distinction visible

This is one of the strongest parts of the current implementation. Keep it.

Use short labels:

- `Your offer`
- `Actual capital change`
- `Other investors`
- `Lake health`
- `Local prosperity`

## Copy recommendations

### Top subtitle

Current:

> Research on the impact of capital market systems

Recommended:

> Research and tools for investor impact

Alternative, slightly more technical:

> Capital-market research, made playable

My preference: **Research and tools for investor impact**.

### Welcome headline

Use:

> A playable model of capital, markets, and real outcomes.

### Welcome body

Use:

> Set offers in a stylized lake economy. The economy clears. Compare the result with the Impact Frontier.

### Play panel heading

Current:

> Set offers. Watch the economy clear.

Keep this. It is good.

### Guide CTA

Current:

> Download from CSP

Recommended:

> Open guide on CSP

### Papers CTA

Use:

> Open on SSRN

or:

> Preview paper

Do not leave disabled buttons on the public version.

### Contact CTA

Use:

> Discuss the work

Secondary options:

- `Email Jonathan`
- `Book a meeting`
- `Start a conversation`

Do not use `Schedule a call` unless you deliberately want to mirror CSP.

## Implementation order

### Phase 1 - fastest high-value changes

Do these first:

1. Replace the color variables with the CSP-adjacent palette.
2. Add Source Serif 4 and apply it to major headings.
3. Rewrite the welcome panel.
4. Add `Play the model`, `Read the papers`, and `Open the guide` actions to the welcome panel.
5. Add `Discuss the work` to the top bar.
6. Change `Guides` to `Guide`.
7. Rename user-facing `harbor` references to `lake`.
8. Change `Download from CSP` to `Open guide on CSP`.
9. Replace disabled SSRN buttons with honest preview/status buttons.

### Phase 2 - credibility polish

1. Redesign About panel with four cards: what this is, model, collaboration, contact.
2. Redesign Guide panel with split editorial layout.
3. Redesign Papers panel so it looks like a working-paper page, not only PDF embeds.
4. Move `Drag to orbit - scroll to zoom` out of the top bar.
5. Reduce glassmorphism and shadow strength.
6. Add a text-only collaboration strip.

### Phase 3 - after CSP approval

1. Add official organization logos in About.
2. Decide whether CSP appears in the top banner.
3. Add official CSP colors and font guidance if provided.
4. Add final SSRN links.
5. Add final meeting and email links.

## Concrete files to change

### `app/layout.tsx`

Add serif font and body font variables.

### `components/lake-economy/LakeEconomyHome.jsx`

Change:

- header nav,
- welcome copy,
- welcome CTA buttons,
- possibly remove standalone `Play` button or connect it more strongly to the welcome panel,
- add a `scene-help` chip.

### `components/lake-economy/lake-economy.css`

Change:

- root color variables,
- typography,
- topbar styling,
- welcome panel styling,
- content panel styling,
- guide hero styling,
- CTA button styles.

### `components/lake-economy/runtime.js`

Change:

- content panel HTML,
- guide CTA label,
- About panel copy,
- paper CTA states,
- top play behavior if you add a `Play the model` button,
- any user-facing `harbor` text.

### `components/lake-economy/scene.js`

Do not make major changes yet. The scene is working. Only consider subtle color tuning later.

## Specific replacement snippets

### Replace active and primary button colors

Find occurrences of:

```css
background: #20342b;
background: #17261f;
```

Replace with:

```css
background: var(--csp-indigo);
```

For hover:

```css
background: var(--csp-indigo-dark);
```

### Replace welcome heading color

Current welcome heading uses teal. Use ink for the editorial title:

```css
.welcome-panel h1 {
  color: var(--csp-ink);
}
```

Use teal only for small accents, not the main hero title.

### Replace Guide button label

In `runtime.js`, replace:

```html
Download from CSP
```

with:

```html
Open guide on CSP
```

### Rename `Guides` to `Guide`

In `LakeEconomyHome.jsx`, replace:

```jsx
Guides
```

with:

```jsx
Guide
```

Then keep the internal mode name `guides` if easier. The user-facing label can be singular.

## What not to do

Do not:

- copy the CSP site wholesale,
- put the CSP logo in the top banner before approval,
- make the site look like a sales page,
- make contact the main action above the game,
- hide the papers behind the game,
- remove the toy-like lake scene,
- over-explain the math in the first screen,
- use disabled CTA buttons in the public version,
- make the lakefront industry a cartoon villain,
- turn the game into a generic ESG ranking tool.

## Recommended final first-screen concept

Top bar:

- TPP mark
- The Impact Frontier
- Research and tools for investor impact
- About
- Papers
- Guide
- Play model
- Discuss the work

Hero card:

> A playable model of capital, markets, and real outcomes.

Subcopy:

> Set offers in a stylized lake economy. The economy clears. Compare the result with the Impact Frontier.

Actions:

- Play the model
- Read the papers
- Open the guide

Behind it:

- The full lake scene, visible and inviting.

This gives you credibility, clarity, CSP alignment, and a clear path into the game.

## Recommended agent instruction

Give this to the next implementation agent:

```text
Update the Lake Economy site to feel like a serious CSP-adjacent research microsite while keeping the lake game visually dominant.

Priority changes:
1. Add an editorial serif heading font, preferably Source Serif 4.
2. Replace the current green primary action color with CSP-adjacent indigo #29285f.
3. Use warm off-white panels, dark navy ink, and deep teal secondary accents.
4. Rewrite the welcome panel with: "A playable model of capital, markets, and real outcomes." Add buttons: Play the model, Read the papers, Open the guide.
5. Add a top-bar CTA: "Discuss the work" linked to Jonathan's email or booking page.
6. Change Guides to Guide.
7. Change the guide CTA to "Open guide on CSP".
8. Redesign About with four cards: what this is, model, collaboration, contact.
9. Keep CSP logo use limited to a secondary About-panel collaboration strip unless approved.
10. Keep the game dominant and keep Papers one click away.

Do not redesign the 3D lake scene yet. Focus on the research wrapper, panels, typography, colors, and CTAs.
```

## Bottom line

The site is already distinctive because of the lake. The main risk is not the game. The main risk is that the research wrapper feels like a prototype rather than a credible research microsite.

The fix is not a full redesign. Add CSP-adjacent typography, color discipline, a stronger welcome message, better content panels, and a soft but visible contact path.
