"use client";

import { useState } from "react";
import SystemVisualization from "@/components/SystemVisualization";
import IntegrationScatterplot from "@/components/IntegrationScatterplot";
import AssistantPanel from "@/components/AssistantPanel";
import PapersPanel from "@/components/PapersPanel";
import GuidesPanel from "@/components/GuidesPanel";

type Tab = "system" | "scatterplot" | "assistant" | "papers" | "guides" ;

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "system";

  const tab = new URLSearchParams(window.location.search).get("tab");

  if (
    tab === "system" ||
    tab === "scatterplot" ||
    tab === "assistant" ||
    tab === "papers"||
    tab === "guides"
  ) {
    return tab;
  }

  return "system";
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

  const [scatterplotMode, setScatterplotMode] = useState<
    "standard" | "combinatorial"
  >("standard");

  function switchTab(tab: Tab) {
    setActiveTab(tab);

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);

    if (tab === "system") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tab);
    }

    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }
  
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1850px] mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Systemic Finance: Tools for understanding CCSP-HSG's work in this new field
          </h1>
        </header>

        <div className="space-y-6">
          <div>
            <div className="flex items-end gap-2 px-2">
              <button
                type="button"
                onClick={() => setActiveTab("system")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "system"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                System
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("scatterplot")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "scatterplot"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Scatterplots
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("papers")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "papers"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Papers
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("guides")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "guides"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Guides
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("assistant")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "assistant"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                AskCCSP
              </button>

            </div>

            <div className="bg-white rounded-3xl rounded-tl-none shadow-sm border border-slate-300 p-6">
              {activeTab === "system" ? (
                <SystemVisualization />
              ) : activeTab === "scatterplot" ? (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-semibold tracking-tight">
                        {scatterplotMode === "standard"
                          ? "Integration scatterplot"
                          : "Combinatorial view"}
                      </h2>
              
                      <p className="text-sm text-slate-600">
                        Scatterplots are a key way to visualize and think about the relationship between impact and financial return.{" "}
                        <a
                          href="https://impactfrontiers.org/norms/impact-financial-integration/relationships-between-impact-financial-return/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline underline-offset-2 hover:text-slate-900"
                        >
                          Learn more
                        </a>
                        .
                      </p>
              
                      <p className="text-sm text-slate-600">
                        Try moving the opportunity dots.
                      </p>
                    </div>
              
                    <div className="inline-flex rounded-2xl border border-slate-300 bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setScatterplotMode("standard")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          scatterplotMode === "standard"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Standard
                      </button>
              
                      <button
                        type="button"
                        onClick={() => setScatterplotMode("combinatorial")}
                        className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                          scatterplotMode === "combinatorial"
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        Combinatorial
                      </button>
                    </div>
                  </div>
              
                  <IntegrationScatterplot mode={scatterplotMode} />
                </div>
              ) : activeTab === "papers" ? (
                <PapersPanel />
              ) : activeTab === "guides" ? (
                <GuidesPanel />
              ) : (
                <AssistantPanel />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
