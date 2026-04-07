"use client";

const PAPERS = [
  {
    id: "paper-1",
    label: "Paper 1",
    title: "The Impact Frontier",
    status: "Working paper",
    // description:
    //   "Preview the opening page here. Use the main link for the full paper when ready.",
    previewUrl: "/papers/impact-frontier-preview.pdf",
    primaryLabel: "Download from SSRN",
    primaryHref: "", // add SSRN link when ready
    // secondaryLabel: "Open preview PDF",
    // secondaryHref: "/papers/impact-frontier-preview.pdf",
  },
  {
    id: "paper-2",
    label: "Paper 2",
    title: "Shifting the Frontier",
    status: "In development",
    // description:
    //   "This currently shows the title and abstract page only.",
    previewUrl: "/papers/shifting-frontier-preview.pdf",
    primaryLabel: "Download from SSRN",
    primaryHref: "", // add SSRN link when ready
    // secondaryLabel: "Open preview PDF",
    // secondaryHref: "/papers/shifting-frontier-preview.pdf",
  },
];

function ActionLink({ href, children, variant = "primary" }) {
  const base =
    "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium transition border";

  const styles =
    variant === "secondary"
      ? "bg-white text-slate-900 border-slate-300 hover:bg-slate-50"
      : "bg-slate-900 text-white border-slate-900 hover:bg-slate-800";

  if (!href) {
    return (
      <span
        className={`${base} ${styles} cursor-default opacity-50`}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${styles}`}
    >
      {children}
    </a>
  );
}

function PdfPreview({ title, previewUrl }) {
  const pdfSrc = `${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-sm max-w-[720px]">
      <div className="aspect-[3/4] w-full bg-white">
        <object data={pdfSrc} type="application/pdf" className="h-full w-full">
          <div className="flex h-full items-center justify-center p-6 text-center text-sm text-slate-600">
            <div className="space-y-3">
              <p>PDF preview not available in this browser.</p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2 font-medium text-slate-900 hover:bg-slate-50"
              >
                Open {title} preview PDF
              </a>
            </div>
          </div>
        </object>
      </div>
    </div>
  );
}

function PaperCard({
  label,
  title,
  status,
  previewUrl,
  primaryLabel,
  primaryHref,
}) {
  return (
    <section className="grid gap-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            {label}
          </div>

          <div className="shrink-0">
            <ActionLink href={primaryHref}>{primaryLabel}</ActionLink>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
          <p className="text-sm font-medium text-slate-500">{status}</p>
        </div>

        <div className="mt-8">
          <PdfPreview title={title} previewUrl={previewUrl} />
        </div>
      </div>
    </section>
  );
}

export default function PapersPanel() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Papers
        </h2>
        <p className="text-sm leading-6 text-slate-600">
          Preview the opening page of each paper here. Use the main paper links
          for full downloads when available.
        </p>
      </div>

      <div className="space-y-8">
        {PAPERS.map((paper) => (
          <PaperCard key={paper.id} {...paper} />
        ))}
      </div>
    </div>
  );
}
