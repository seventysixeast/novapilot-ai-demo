export default function DocsPage() {
  const guides = [
    "quickstart-first-insight.md",
    "connector-setup-stripe-hubspot-ga4.md",
    "trust-system-confidence-citations.md",
    "billing-trials-coupons-referrals.md",
    "launch-checklist.md",
    "go-live-runbook.md",
    "monitoring-playbook.md",
    "env-target-matrix.md",
    "deployment-guide.md",
    "environment-setup.md",
    "architecture-overview.md",
    "api-overview.md",
    "branding-guidelines.md",
    "seo-checklist.md",
    "production-readiness.md",
  ];

  return (
    <main className="mx-auto max-w-4xl space-y-4 px-6 py-14">
      <h1 className="text-3xl font-semibold text-slate-900">Documentation</h1>
      <p className="text-slate-600">
        Developer setup, onboarding docs, connector guides, trust system docs, and production runbooks.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((item) => (
          <article key={item} className="card p-4 text-sm font-medium text-slate-800">
            {item}
          </article>
        ))}
      </div>
    </main>
  );
}
