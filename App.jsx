const { useState } = React;

function App() {
  const [activeTab, setActiveTab] = useState("system");

  const SystemVisualization = window.SystemVisualization;
  const IntegrationScatterplot = window.IntegrationScatterplot;

const SCATTERPLOT_SRC = "/integration_scatterplot_concept_v8_preview.svg";

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
              ) : IntegrationScatterplot ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-3">
                    <IntegrationScatterplot />
                    {/* <img
                      src={SCATTERPLOT_SRC}
                      alt="Integration scatterplot"
                      className="w-full h-auto rounded-2xl"
                    /> */}
                  </div>
              ) : (
                <p className="text-sm text-slate-600">
                  Scatterplot visualization not loaded.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);