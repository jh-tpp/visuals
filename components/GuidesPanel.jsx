"use client";

const GUIDES = [
  {
    id: "goals-based-guide",
    title: "Investor’s Guide to Goals-based Investing and Philanthropy",
    status: "Preview page only. Full guide not yet public.",
    previewSrc: "/guides/goals-based-preview.png",
    previewType: "image",
    downloadHref: "",
    downloadLabel: "Download from CSP",
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
        className="h-[600px] w-full rounded-2xl border border-slate-200 object-contain bg-white"
      />
    );
  }

  return (
    <iframe
      src={guide.previewSrc}
      title={guide.title}
      className="h-[600px] w-full rounded-2xl border border-slate-200 bg-white"
    />
  );
}

function GuideCard({ guide }) {
  return (
    <section className="grid gap-6 justify-start">
      <div className="w-[648px] max-w-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            {guide.title}
          </h2>
          <p className="text-sm text-slate-600">
            {guide.status}
          </p>
        </div>

        <div className="shrink-0">
          <ActionButton
            href={guide.downloadHref}
            disabled={guide.downloadDisabled}
          >
            {guide.downloadLabel}
          </ActionButton>
        </div>
      </div>

      <GuidePreview guide={guide} />
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
          Preview pages for practitioner-facing publications.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-8">
        {GUIDES.map((guide) => (
          <div key={guide.id} className="flex-none">
            <GuideCard key={guide.id} guide={guide} />
          </div>
        ))}
      </div>
    </div>
  );
}
