import Link from "next/link";

export default function EnterpriseTrustPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Enterprise Trust Center</h1>
      <p className="text-slate-600">
        Built for startup execution and enterprise confidence: transparent security, explainable AI, and governance-ready workflows.
      </p>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="card p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Trust-first AI</p>
          <p className="mt-2">Confidence scores, source citations, freshness metadata, and fallback handling.</p>
        </article>
        <article className="card p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Governance</p>
          <p className="mt-2">RBAC, workspace isolation, audit logs, and secure connector operations.</p>
        </article>
        <article className="card p-5 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Operational reliability</p>
          <p className="mt-2">Sync monitoring, retry-safe jobs, incident communication, and alerting.</p>
        </article>
      </section>
      <div className="card p-5 text-sm text-slate-700">
        Need security review support? <Link className="font-semibold text-sky-700" href="/contact">Contact sales and security team</Link>.
      </div>
    </main>
  );
}
