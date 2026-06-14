"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function LakeEconomyHome() {
  const rootRef = useRef(null);

  useEffect(() => {
    let cleanup = null;
    let cancelled = false;

    async function mountRuntime() {
      const { initLakeEconomy } = await import("./runtime.js");
      if (cancelled || !rootRef.current) return;
      cleanup = initLakeEconomy(rootRef.current);
    }

    mountRuntime();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <main ref={rootRef} className="lake-economy-root">
      <div id="appShell">
        <header className="topbar" aria-label="Research navigation">
          <Link className="logo-link" href="/" aria-label="Total Portfolio Project home">
            <img src="/TPP.png" alt="Total Portfolio Project" />
          </Link>

          <div className="brand-block">
            <strong>The Impact Frontier</strong>
            <span>Research and tools for investor impact</span>
          </div>

          <nav className="top-nav" aria-label="Research panels">
            <button type="button" data-panel="about">
              About
            </button>
            <button type="button" data-panel="papers">
              Papers
            </button>
            <button type="button" data-panel="guides">
              Guide
            </button>
          </nav>

          <a className="top-cta" href="mailto:jonathan@total-portfolio.org">
            Discuss the work
          </a>
        </header>

        <main className="world-shell" aria-label="Interactive lake economy">
          <div className="sky-gradient" aria-hidden="true" />
          <canvas id="lakeCanvas" />
          <div id="labels" aria-hidden="false" />
          <div
            id="entityPopup"
            className="entity-popup hidden"
            role="dialog"
            aria-label="Entity characteristics"
          />
          <div className="scene-controls" aria-label="Scene controls">
            <button id="cityModeBtn" type="button" aria-pressed="false">
              City skyline
            </button>
            <div className="scene-help">Drag to orbit · scroll to zoom</div>
          </div>
        </main>

        <section id="welcomePanel" className="welcome-panel" aria-label="Welcome">
          <span className="eyebrow">Total Portfolio Project research</span>
          {/* REVIEW COPY: Jonathan may want to rephrase this headline/body in his own voice. */}
          <h1>A playable model of capital, markets, and real outcomes.</h1>
          <p>
            Set offers in a stylized lake economy. The economy clears. Compare the result with the Impact Frontier.
          </p>
          <div className="welcome-actions">
            <button type="button" className="primary-action" data-open-play>
              Play the model
            </button>
            <button type="button" className="secondary-action" data-panel="papers">
              Read the papers
            </button>
            <button type="button" className="secondary-action" data-panel="guides">
              Open the guide
            </button>
          </div>
        </section>

        <button
          id="panelToggle"
          className="panel-toggle"
          type="button"
          aria-controls="playPanel"
          aria-expanded="false"
        >
          Play
        </button>

        <aside id="playPanel" className="play-panel collapsed" aria-label="Lake Economy controls">
          <div className="panel-topline">
            <div>
              <span className="eyebrow">Interactive demo</span>
              <h1>Set offers. Watch the economy clear.</h1>
            </div>
            <button id="minimizePanel" type="button" className="icon-button" aria-label="Minimize controls">
              -
            </button>
          </div>

          <section className="scenario-card" aria-label="Current scenario">
            <div className="scenario-heading">
              <strong id="scenarioName">Scenario</strong>
              <span id="lakeSeed">seed</span>
            </div>
            <p id="scenarioText" />
            <small id="scenarioNote" />
          </section>

          <section className="control-section goal-section" aria-label="Choose your goal" data-step="1">
            <div className="section-title">
              <span className="step-dot">1</span>
              <div>
                <strong>What are you trying to improve?</strong>
                <small id="goalHint">Choose a goal to unlock the offer sheet.</small>
              </div>
            </div>
            <div className="goal-pills" role="group" aria-label="Goal presets">
              <button type="button" className="goal-pill" data-goal="100">
                Lake health
              </button>
              <button type="button" className="goal-pill" data-goal="50">
                Balanced
              </button>
              <button type="button" className="goal-pill" data-goal="0">
                Local prosperity
              </button>
            </div>
            <label className="range-label" htmlFor="goalSlider">
              <span>Lake health</span>
              <b id="goalReadout">No goal selected</b>
              <span>Prosperity</span>
            </label>
            <input id="goalSlider" className="wide-range" type="range" min="0" max="100" defaultValue="50" step="5" />
            <details id="voiceToggle" className="voices">
              <summary>Optional local voices</summary>
              <div className="voice-grid">
                <p>
                  <b>Fish farmers</b> Reliable feed and market access would help us produce more and earn steadier incomes.
                </p>
                <p>
                  <b>Families</b> We need affordable local food and jobs that last.
                </p>
                <p>
                  <b>Lake stewards</b> The water supports the whole economy. Growth that damages it will not last.
                </p>
              </div>
            </details>
          </section>

          <section
            id="offerSection"
            className="control-section offer-section locked"
            aria-label="Set offer tokens"
            data-step="2"
          >
            <div className="lock-scrim">Complete Step 1 to set offers.</div>
            <div className="section-title">
              <span className="step-dot">2</span>
              <div>
                <strong>Allocate 100 offer tokens</strong>
                <small>Offers shift supply. The market decides actual capital.</small>
              </div>
            </div>
            <div className="token-row">
              <span>
                <b id="totalTokens">0</b>/100 allocated
              </span>
              <span className="token-pool" id="unallocatedTokens">
                100
              </span>
            </div>
            <div className="preset-row" aria-label="Offer presets">
              <button type="button" className="preset-btn" data-preset="equal">
                Equal
              </button>
              <button type="button" className="preset-btn" data-preset="payoff">
                Highest payoff
              </button>
              <button type="button" className="preset-btn" data-preset="outcome">
                Highest raw outcome
              </button>
              <button type="button" className="preset-btn subtle" data-preset="soft-outcome">
                Soft outcome tilt
              </button>
            </div>
            <div id="offersList" className="offers-list" />
          </section>

          <section className="action-strip" aria-label="Economy actions">
            <button id="runBtn" type="button" className="primary-action" disabled>
              Run economy
            </button>
            <button id="freshBtn" type="button">
              Start fresh
            </button>
            <button id="newLakeBtn" type="button">
              New lake
            </button>
            <button id="resetViewBtn" type="button">
              Reset view
            </button>
          </section>

          <section
            id="resultSection"
            className="result-section locked"
            aria-label="Results and frontier"
            data-step="3"
          >
            <div className="lock-scrim">Run the economy to reveal the cleared result.</div>
            <div className="section-title compact-title">
              <span className="step-dot">3</span>
              <div>
                <strong>Cleared result</strong>
                <small id="bestReadout">No run yet</small>
              </div>
            </div>
            <div id="resultSummary" />
            <div id="frontierChart" className="frontier-chart" />
            <details className="response-details" open>
              <summary>Offers vs. actual capital change</summary>
              <div className="actual-explainer">
                Actual capital means total firm capital after market clearing, measured as a change from the equal-offer
                baseline. Other investors remain in the market and may increase or decrease their positions as prices and firm
                demand change.
              </div>
              <div id="resultTable" />
            </details>
          </section>

          <footer className="status-line" id="statusLine">
            Open the play panel when you want to test the lake economy. Research panels remain available at all times.
          </footer>
        </aside>

        <section id="contentPanel" className="content-panel hidden" aria-label="Research content panel">
          <div className="content-card">
            <div className="content-header">
              <span className="eyebrow">Research</span>
              <h2 id="contentTitle">About</h2>
              <button id="closeContent" type="button" className="icon-button" aria-label="Close research panel">
                x
              </button>
            </div>
            <div id="contentBody" className="content-body" />
          </div>
        </section>
      </div>
    </main>
  );
}
