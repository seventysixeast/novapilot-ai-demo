import Link from "next/link";

const guides = [
  "Quickstart: first trusted insight in 5 minutes",
  "Stripe connector setup",
  "HubSpot connector setup",
  "GA4 connector setup",
  "AI query best practices",
  "Low-confidence response troubleshooting",
  "Billing and quota management",
  "Weekly review workflow playbook",
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Help Center</h1>
      <p className="text-slate-600">
        Onboarding guides, connector setup docs, and practical troubleshooting for startup teams.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((guide) => (
          <article key={guide} className="card p-4 text-sm font-medium text-slate-800">
            {guide}
          </article>
        ))}
      </div>
      <div className="card p-5 text-sm text-slate-700">
        Need direct support? Reach us at <Link className="font-semibold text-sky-700" href="/contact">Contact</Link>.
      </div>
    </main>
  );
}
