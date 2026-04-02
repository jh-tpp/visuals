const { useState } = React;

function App() {
  const [activeTab, setActiveTab] = useState("system");

  const SystemVisualization = window.SystemVisualization;
  const IntegrationScatterplot = window.IntegrationScatterplot;

  // Paste your public NotebookLM chat-view URL here
  const NOTEBOOKLM_URL = "https://notebooklm.google.com/notebook/f7e44b85-2671-41a9-a9c9-3d20fc791c43";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1850px] mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Interactive flow field for a system aware economic model
          </h1>
        </header>

        <div className="space-y-6">
          <div>
            <div className="flex items-end gap-2 px-2 flex-wrap">
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
                SystemVisualization ? (
                  <SystemVisualization />
                ) : (
                  <p className="text-sm text-slate-600">
                    System visualization not loaded.
                  </p>
                )
              ) : activeTab === "scatterplot" ? (
                IntegrationScatterplot ? (
                  <IntegrationScatterplot mode="standard" />
                ) : (
                  <p className="text-sm text-slate-600">
                    Scatterplot visualization not loaded.
                  </p>
                )
              ) : activeTab === "combinatorial" ? (
                IntegrationScatterplot ? (
                  <IntegrationScatterplot mode="combinatorial" />
                ) : (
                  <p className="text-sm text-slate-600">
                    Combinatorial visualization not loaded.
                  </p>
                )
              ) : (
                <NotebookLMPanel url={NOTEBOOKLM_URL} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotebookLMPanel({ url }) {
  const hasUrl =
    url &&
    url !== "PASTE_YOUR_NOTEBOOKLM_CHAT_VIEW_URL_HERE" &&
    url.trim() !== "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">
          Research assistant
        </h2>
        <p className="text-sm text-slate-600 max-w-3xl">
          Ask questions about Jon&apos;s publications and related material. If the embedded
          view does not load in your browser, open it in a new tab instead.
        </p>
      </div>

      {hasUrl ? (
        <>
          <div className="flex items-center gap-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50"
            >
              Open in new tab
            </a>
          </div>

          <div className="rounded-3xl border border-slate-300 overflow-hidden bg-slate-50">
            <iframe
              src={url}
              title="NotebookLM research assistant"
              className="w-full"
              style={{ height: "78vh", minHeight: "720px", border: "0" }}
              allow="clipboard-read; clipboard-write"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Paste your public NotebookLM chat-view URL into <code>NOTEBOOKLM_URL</code> in{" "}
          <code>App.jsx</code>.
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
