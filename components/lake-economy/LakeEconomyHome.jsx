"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BOOKING_URL, CONTACT_EMAIL, SUPPORT_URL } from "./contact-config.js";

function copyTextWithFallback(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.left = "-9999px";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export default function LakeEconomyHome() {
  const rootRef = useRef(null);
  const closeContactRef = useRef(null);
  const contactModalRef = useRef(null);
  const lastFocusedRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [isContactOpen, setContactOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");

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

  useEffect(() => {
    if (!isContactOpen) return;

    lastFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeContactRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        setContactOpen(false);
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        contactModalRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter((element) => element instanceof HTMLElement && element.offsetParent !== null);

      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isContactOpen]);

  useEffect(() => {
    if (isContactOpen) return;
    setCopyStatus("");
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    lastFocusedRef.current?.focus?.();
    lastFocusedRef.current = null;
  }, [isContactOpen]);

  async function copyContactEmail() {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(CONTACT_EMAIL);
        } catch {
          copyTextWithFallback(CONTACT_EMAIL);
        }
      } else {
        copyTextWithFallback(CONTACT_EMAIL);
      }
      setCopyStatus("Copied");
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopyStatus(""), 2200);
    } catch {
      setCopyStatus("Copy failed");
    }
  }

  return (
    <main ref={rootRef} className="lake-economy-root">
      <div id="appShell">
        <header className="topbar" aria-label="Research navigation">
          <Link className="logo-link" href="/" aria-label="Total Portfolio Project home">
            <img src="/TPP.png" alt="Total Portfolio Project" />
          </Link>

          <div className="brand-block">
            <strong>The Impact Frontier</strong>
            <span>Research and models for investor impact</span>
          </div>

          <nav className="top-nav" aria-label="Research panels">
            <button type="button" data-panel="about">
              About
            </button>
            <button type="button" data-panel="papers">
              Papers
            </button>
            <button type="button" data-panel="guides">
              Guides
            </button>
          </nav>

          <button
            className="top-cta"
            type="button"
            data-open-contact
            aria-haspopup="dialog"
            aria-controls="contactPanel"
            aria-expanded={isContactOpen}
            onClick={() => setContactOpen(true)}
          >
            Contact
          </button>
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
          <span className="eyebrow">Total Portfolio Project presents</span>
          {/* REVIEW COPY: Jonathan may want to rephrase this headline/body in his own voice. */}
          <h1>An interactive model of investor impact.</h1>
          <p>
            Make investment offers in a stylized lake economy. See if you can reach the Impact Frontier.
          </p>
          <div className="welcome-actions">
            <button type="button" className="primary-action" data-open-play>
              Play the model
            </button>
            <button type="button" className="secondary-action" data-panel="papers">
              Read the papers
            </button>
            <button type="button" className="secondary-action" data-panel="guides">
              Open the guides
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
              <h1>Make offers. See how the economy reacts.</h1>
            </div>
            <button id="minimizePanel" type="button" className="icon-button" aria-label="Minimize controls">
              -
            </button>
          </div>

          <section className="control-section goal-section" aria-label="Choose your goal" data-step="1">
            <div className="section-title">
              <span className="step-dot">1</span>
              <div>
                <strong>What is your impact goal?</strong>
                <small id="goalHint">Choose which outcomes you want to prioritize.</small>
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

          <section className="scenario-card" aria-label="Current scenario">
            <div className="scenario-heading">
              <strong id="scenarioName">Scenario:</strong>
              <span id="lakeSeed" className="sr-only" aria-hidden="true">
                seed
              </span>
            </div>
            <p id="scenarioText" />
            <small id="scenarioNote" />
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
                <strong>Place 100 offer tokens</strong>
                <small>Offers shift the supply of capital and the companies react.</small>
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
              <button type="button" className="preset-btn" data-preset="return">
                Highest return
              </button>
              <button type="button" className="preset-btn" data-preset="outcome">
                Highest raw outcome
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
            {/* <button id="resetViewBtn" type="button">
              Reset view
            </button> */}
          </section>

          <section
            id="resultSection"
            className="result-section locked"
            aria-label="Results and frontier"
            data-step="3"
          >
            <div className="lock-scrim">Run the economy to reveal the result.</div>
            <div className="section-title compact-title">
              <span className="step-dot">3</span>
              <div>
                <strong>Market-clearing result</strong>
                <small id="bestReadout">No run yet</small>
              </div>
            </div>
            <div id="resultSummary" />
            <div className="frontier-panel" aria-labelledby="frontierTitle">
              <div className="frontier-panel-header">
                <h3 id="frontierTitle">The Impact Frontier</h3>
                <button
                  id="expandFrontierBtn"
                  type="button"
                  className="frontier-expand-btn"
                  aria-label="Expand The Impact Frontier chart"
                  aria-controls="frontierModal"
                  disabled
                >
                  ↗
                </button>
              </div>
              <button
                id="frontierChart"
                className="frontier-chart"
                type="button"
                aria-label="Open a larger view of The Impact Frontier"
                disabled
              />
            </div>
            <details className="response-details" open>
              <summary>Offers vs. actual capital change</summary>
              <div className="actual-explainer">
                The offer is what you choose. Actual capital is what changes after firms and other investors respond.
              </div>
              <div id="resultTable" />
            </details>
          </section>

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

        <section
          id="frontierModal"
          className="frontier-modal hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="frontierModalTitle"
        >
          <div className="frontier-modal-card">
            <div className="frontier-modal-header">
              <span className="eyebrow">Result view</span>
              <h2 id="frontierModalTitle">The Impact Frontier</h2>
              <button id="closeFrontierModal" type="button" className="icon-button" aria-label="Close frontier view">
                x
              </button>
            </div>
            <div id="frontierModalChart" className="frontier-modal-chart" />
          </div>
        </section>

        <section
          id="contactPanel"
          className={`contact-panel${isContactOpen ? "" : " hidden"}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="contactPanelTitle"
          aria-describedby="contactPanelBody"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) setContactOpen(false);
          }}
        >
          <div className="contact-modal" ref={contactModalRef}>
            <div className="contact-modal-header">
              <span className="eyebrow">Contact</span>
              <h2 id="contactPanelTitle">Discuss this work</h2>
              <button
                id="closeContact"
                type="button"
                className="icon-button"
                aria-label="Close contact panel"
                ref={closeContactRef}
                onClick={() => setContactOpen(false)}
              >
                x
              </button>
            </div>
            <p id="contactPanelBody" className="contact-intro">
              The Impact Frontier is independent research on how capital-market choices affect real outcomes. For
              collaboration, funding, talks, research partnerships, or technical discussion, please get in touch.
            </p>
            <div className="contact-primary-actions">
              {BOOKING_URL ? (
                <a className="research-action" href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                  Book a conversation
                </a>
              ) : (
                <button
                  className="research-action"
                  type="button"
                  disabled
                  title="Booking link coming soon"
                >
                  Book a conversation
                </button>
              )}
              <a className="research-action secondary-link" href={`mailto:${CONTACT_EMAIL}`}>
                Email Jon
              </a>
            </div>
            {!BOOKING_URL ? <span className="contact-placeholder">Booking link coming soon.</span> : null}
            <div className="contact-email-row">
              <span className="contact-email-label">Email</span>
              <span className="contact-email-copy-group">
                <span className="contact-email-address">{CONTACT_EMAIL}</span>
                <button
                  id="copyContactEmail"
                  type="button"
                  className="contact-copy-button"
                  aria-label="Copy email"
                  title="Copy email"
                  onClick={copyContactEmail}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="9" y="9" width="10" height="10" rx="2" />
                    <path d="M5 15V7a2 2 0 0 1 2-2h8" />
                  </svg>
                </button>
              </span>
              <span id="copyEmailStatus" className="copy-status" aria-live="polite">
                {copyStatus}
              </span>
            </div>
            {SUPPORT_URL ? (
              <section className="contact-support-section" aria-labelledby="supportPanelTitle">
                <h3 id="supportPanelTitle">Support the next stage</h3>
                <p>
                  This site is free to read and play with. If it helped you understand the research, you can support
                  the next stage of the project.
                </p>
                <a className="research-action secondary-link" href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
                  Support this work
                </a>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
