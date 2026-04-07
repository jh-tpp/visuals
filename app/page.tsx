"use client";

import { useState } from "react";
import SystemVisualization from "@/components/SystemVisualization";
import IntegrationScatterplot from "@/components/IntegrationScatterplot";
import AssistantPanel from "@/components/AssistantPanel";

type Tab = "system" | "scatterplot" | "combinatorial" | "assistant";

function getInitialTab(): Tab {
  if (typeof window === "undefined") return "system";

  const tab = new URLSearchParams(window.location.search).get("tab");

  if (
    tab === "system" ||
    tab === "scatterplot" ||
    tab === "combinatorial" ||
    tab === "assistant"
  ) {
    return tab;
  }

  return "system";
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);

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
                Scatterplot
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("combinatorial")}
                className={`rounded-t-2xl border border-slate-300 border-b-0 px-5 py-2 text-sm font-medium transition ${
                  activeTab === "combinatorial"
                    ? "bg-white text-slate-900"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Combinatorial
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
                Assistant
              </button>
            </div>

            <div className="bg-white rounded-3xl rounded-tl-none shadow-sm border border-slate-300 p-6">
              {activeTab === "system" ? (
                <SystemVisualization />
              ) : activeTab === "scatterplot" || activeTab === "combinatorial" ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {activeTab === "scatterplot"
                        ? "Integration scatterplot"
                        : "Combinatorial view"}
                    </h2>
                    <p className="text-sm text-slate-600">
                      Try moving the opportunity dots.
                    </p>
                  </div>

                  <IntegrationScatterplot
                    mode={activeTab === "scatterplot" ? "standard" : "combinatorial"}
                  />
                </div>
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
