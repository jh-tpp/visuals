"use client";

import { useState } from "react";
import SystemVisualization from "@/components/SystemVisualization";
import IntegrationScatterplot from "@/components/IntegrationScatterplot";
import AssistantPanel from "@/components/AssistantPanel";

export default function Page() {
  const [activeTab, setActiveTab] = useState<
  "system" | "scatterplot" | "combinatorial" | "assistant"
>("system");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1850px] mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Interactive flow field for a system aware economic model
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
              ) : activeTab === "scatterplot" ? (
                <IntegrationScatterplot mode="standard" />
              ) : activeTab === "combinatorial" ? (
                <IntegrationScatterplot mode="combinatorial" />
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
