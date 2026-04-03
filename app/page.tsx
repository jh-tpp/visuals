export default function Page() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Visuals - Next.js migration
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            This branch is the new Next.js foundation for the existing visuals site.
            The current tabs and visualizations will be ported over next.
          </p>
        </header>

        <section className="bg-white rounded-3xl shadow-sm border border-slate-300 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Migration status</h2>
          <ul className="mt-4 list-disc pl-6 text-slate-700 space-y-2">
            <li>Next.js shell is live on the migration branch</li>
            <li>Current static site is preserved in <code>legacy-static/</code></li>
            <li>Next step is to port the tab shell and one visualization at a time</li>
          </ul>
        </section>
      </div>
    </main>
  );
}