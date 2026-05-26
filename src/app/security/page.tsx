export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-14">
      <header className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Security at startup speed, enterprise confidence</h1>
        <p className="max-w-3xl text-slate-600">
          NovaPilot AI protects workspace data with tenant isolation, role-based access, auditability, and trust-first
          AI response controls.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Data protection</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>TLS encryption in transit across app and API requests.</li>
            <li>Encrypted infrastructure at rest for stored data and backups.</li>
            <li>Workspace isolation using multi-tenant Row Level Security policies.</li>
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="text-lg font-semibold text-slate-900">Identity and access</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li>Role-based permissions for owner, admin, and member actions.</li>
            <li>Least-privilege defaults on sensitive workspace operations.</li>
            <li>Session visibility and account-level security controls.</li>
          </ul>
        </article>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-slate-900">AI trust architecture</h2>
        <p className="mt-2 text-sm text-slate-600">
          Important AI responses include confidence scoring, source citations, and data freshness metadata.
          If sources are weak or stale, NovaPilot AI warns clearly instead of pretending certainty.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="card p-5">
          <h3 className="text-base font-semibold text-slate-900">Audit logs</h3>
          <p className="mt-2 text-sm text-slate-600">Track role updates, connector changes, and admin-level actions.</p>
        </article>
        <article className="card p-5">
          <h3 className="text-base font-semibold text-slate-900">Connector safety</h3>
          <p className="mt-2 text-sm text-slate-600">Sync jobs are idempotent, observable, and retry-safe by design.</p>
        </article>
        <article className="card p-5">
          <h3 className="text-base font-semibold text-slate-900">Operational monitoring</h3>
          <p className="mt-2 text-sm text-slate-600">Alerting and incident workflows support transparent communication.</p>
        </article>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold text-slate-900">Security FAQ</h2>
        <div className="mt-3 space-y-3 text-sm">
          <article>
            <p className="font-semibold text-slate-900">Can one workspace access another workspace?</p>
            <p className="text-slate-600">No. Multi-tenant isolation and RLS policies enforce strict boundaries.</p>
          </article>
          <article>
            <p className="font-semibold text-slate-900">Do AI answers include evidence?</p>
            <p className="text-slate-600">Yes, with source references, confidence score, and freshness metadata.</p>
          </article>
          <article>
            <p className="font-semibold text-slate-900">Do you support enterprise security review?</p>
            <p className="text-slate-600">Yes. We provide architecture details and trust documentation for procurement.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
