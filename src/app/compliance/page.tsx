export default function CompliancePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Compliance & Governance</h1>
      <p className="text-slate-600">
        NovaPilot AI provides governance-ready controls for scaling startups and enterprise onboarding.
      </p>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Governance controls</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Role-based access and workspace isolation.</li>
            <li>Audit trail visibility for high-impact events.</li>
            <li>Connector health and data freshness monitoring.</li>
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Enterprise onboarding</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Security documentation package on request.</li>
            <li>Procurement and risk review support.</li>
            <li>Dedicated launch plan for larger teams.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
