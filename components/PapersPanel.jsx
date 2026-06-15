"use client";

const PAPERS = [
  {
    id: "paper-1",
    label: "Paper 1",
    title: "The Impact Frontier",
    status: "Working paper",
    description:
      "How portfolio tilts move capital, returns, and external outcomes through an equilibrium response system. The Lake Economy game is a stylized front-end version of this idea.",
    imageSrc: "/papers/paper1.png",
    imageAlt: "The Impact Frontier paper preview",
    primaryLabel: "Preview paper",
    primaryHref: "/papers/impact-frontier-preview.pdf",
    downloadDisabled: false,
  },
  {
    id: "paper-2",
    label: "Paper 2",
    title: "Shifting the Frontier",
    status: "In development",
    description:
      "How larger coalitions, policy, stewardship, and other instruments can change the response system itself, not just move along a fixed frontier.",
    imageSrc: "/papers/paper2.png",
    imageAlt: "Shifting the Frontier paper preview",
    primaryLabel: "Preview paper",
    primaryHref: "/papers/shifting-frontier-preview.pdf",
    downloadDisabled: false,
  },
];

function ActionLink({ href, 
  disabled = false, children, variant = "primary" 
}) {
  if (disabled || !href) {
    const base =
      "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition border";
  
    const styles =
      variant === "secondary"
        ? "bg-white text-slate-900 border-slate-300"
        : "bg-slate-900 text-white border-slate-900";
  
    return (
      <button
        type="button"
        disabled
        className={`${base} ${styles} cursor-not-allowed opacity-50`}
        aria-disabled="true"
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

function PaperCard({
  label,
  title,
  status,
  description,
  imageSrc,
  imageAlt,
  primaryLabel,
  primaryHref,
}) {
  return (
    <section className="grid gap-6">
      <div className="grid w-full max-w-full grid-cols-[minmax(160px,240px)_1fr] items-center gap-[clamp(24px,5vw,64px)] rounded-2xl border border-slate-200 bg-white p-[clamp(24px,5vw,56px)] shadow-sm max-md:grid-cols-1">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 shadow-[0_18px_40px_rgba(24,24,39,0.12)]">
          <img
            src={imageSrc}
            alt={imageAlt}
            className="aspect-[3/4] w-full object-cover"
          />
        </div>

        <div className="space-y-4">
          <div className="inline-flex w-fit items-center rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
            {label}
          </div>
          <div className="space-y-2">
            <h3 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500">{status}</p>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            {description}
          </p>
          <ActionLink href={primaryHref}>{primaryLabel}</ActionLink>
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
          Working papers behind the model. SSRN links will be added when available.
        </p>
      </div>

      <div className="grid gap-8">
        {PAPERS.map((paper) => (
          <div key={paper.id}>
            <PaperCard {...paper} />
          </div>
        ))}
      </div>
    </div>
  );
}
