export default function RoadmapPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Product Roadmap</h1>
      <p className="text-slate-600">Transparent roadmap for trust-first AI analytics and weekly decision workflows.</p>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Now",
            items: ["Citation inspection drawer", "Confidence and freshness in chat", "Connector sync reliability"],
          },
          {
            title: "Next",
            items: ["Streaming answer transport", "Automated weekly growth digests", "Advanced anomaly detection"],
          },
          {
            title: "Later",
            items: ["Enterprise SSO/SAML", "Custom governance policies", "Cross-workspace portfolio insights"],
          },
        ].map((column) => (
          <article key={column.title} className="card p-5">
            <h2 className="text-lg font-semibold text-slate-900">{column.title}</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {column.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
