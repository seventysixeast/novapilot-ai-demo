const faqs = [
  {
    q: "How quickly can we get first value?",
    a: "Most teams connect a source and generate a trusted first insight in under 10 minutes.",
  },
  {
    q: "How does NovaPilot avoid hallucinations?",
    a: "Important answers show confidence, citations, and freshness. Low-confidence answers warn clearly.",
  },
  {
    q: "Which tools can we integrate first?",
    a: "Stripe, HubSpot, and GA4 are supported first for startup growth workflows.",
  },
  {
    q: "Can we collaborate across teams?",
    a: "Yes. Workspaces support role-based access, shared insights, weekly reviews, and alerts.",
  },
  {
    q: "Do you support enterprise teams?",
    a: "Yes. Compliance, governance, procurement support, and trust documentation are available.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Frequently Asked Questions</h1>
      <div className="space-y-3">
        {faqs.map((item) => (
          <article key={item.q} className="card p-5">
            <h2 className="text-base font-semibold text-slate-900">{item.q}</h2>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
