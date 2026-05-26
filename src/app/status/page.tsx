export default function StatusPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">System Status</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          { name: "API", status: "Operational", tone: "text-emerald-700 bg-emerald-50" },
          { name: "AI responses", status: "Operational", tone: "text-emerald-700 bg-emerald-50" },
          { name: "Connector sync engine", status: "Operational", tone: "text-emerald-700 bg-emerald-50" },
          { name: "Webhooks", status: "Monitoring", tone: "text-amber-700 bg-amber-50" },
        ].map((service) => (
          <article key={service.name} className="card p-4">
            <p className="text-sm font-semibold text-slate-900">{service.name}</p>
            <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${service.tone}`}>
              {service.status}
            </p>
          </article>
        ))}
      </div>
      <article className="card p-5 text-sm text-slate-700">
        Incident communication policy: we publish impact, mitigation, and next update ETA for every major incident.
      </article>
    </main>
  );
}
