export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-5 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Changelog</h1>
      {[
        {
          version: "v1.3.0",
          title: "Trust and billing systems expansion",
          notes: [
            "Added confidence/citation inspection UX and freshness metadata surfaces",
            "Implemented trials, coupons, referrals, and quota visibility foundations",
            "Added roadmap, compliance, FAQ, pricing, and help center pages",
          ],
        },
        {
          version: "v1.2.0",
          title: "Connector reliability and onboarding workflows",
          notes: [
            "Connector sync workflows with idempotent job tracking",
            "Role-based onboarding and weekly review pages",
            "Trust-aware chat guardrails and fallback handling",
          ],
        },
      ].map((release) => (
        <article key={release.version} className="card p-4">
          <p className="text-sm font-semibold text-slate-900">
            {release.version} - {release.title}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {release.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </article>
      ))}
    </main>
  );
}
