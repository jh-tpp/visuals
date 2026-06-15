"use client";

const GUIDES = [
  {
    id: "goals-based-guide",
    title: "Investor’s Guide to Goals-based Investing and Philanthropy",
    eyebrow: "Current featured guide",
    status: "A practical starting point for turning clear goals into coherent strategies across your portfolio.",
    previewSrc: "/guides/ig-goals-cover.jpg",
    previewType: "image",
    downloadHref: "https://www.cspglobal.org/research/publications/investors-guide-goals-based-investing-and-philanthropy",
    downloadLabel: "Open guide on CSP",
    downloadDisabled: false,
  },
  {
    id: "impact-returns-three-cases",
    title: "Impact Returns: Three Case Studies",
    eyebrow: "Legacy report by Total Portfolio Project",
    status:
      "Three high-provenance cases and one next-generation approach to integrating impact and financial analysis.",
    note: "Early Total Portfolio Project report, formerly featured and included here for legacy context.",
    previewSrc: "/guides/three_cases_TPP.png",
    previewType: "image",
    downloadHref: "",
    downloadLabel: "Report link coming soon",
    downloadDisabled: true,
  },
];

function ActionButton({
  href,
  disabled = false,
  children,
}) {
  if (disabled || !href) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
    >
      {children}
    </a>
  );
}

function GuidePreview({ guide }) {
  if (guide.previewType === "image") {
    return (
      <img
        src={guide.previewSrc}
        alt={guide.title}
        className="h-[720px] w-full rounded-2xl border border-slate-200 object-contain bg-white"
      />
    );
  }

  return (
    <iframe
      src={guide.previewSrc}
      title={guide.title}
      className="h-[720px] w-full rounded-2xl border border-slate-200 bg-white"
    />
  );
}

function GuideCard({ guide }) {
  return (
    <section className="grid gap-6 justify-start">
      <div className="w-[768px] max-w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <ActionButton
              href={guide.downloadHref}
              disabled={guide.downloadDisabled}
            >
              {guide.downloadLabel}
            </ActionButton>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          {guide.eyebrow ? (
            <span className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
              {guide.eyebrow}
            </span>
          ) : null}
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {guide.title}
          </h2>
          <p className="text-sm font-medium text-slate-500">
            {guide.status}
          </p>
          {guide.note ? (
            <p className="text-sm leading-6 text-slate-500">
              {guide.note}
            </p>
          ) : null}
        </div>

        <div className="mt-8">
          <GuidePreview guide={guide} />
        </div>
      </div>
    </section>
  );
}

export default function GuidesPanel() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Guides
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Practitioner-facing publications connected to the model.
        </p>
      </div>

      <div className="grid gap-8">
        {GUIDES.map((guide) => (
          <div key={guide.id}>
            <GuideCard key={guide.id} guide={guide} />
          </div>
        ))}
      </div>
    </div>
  );
}
