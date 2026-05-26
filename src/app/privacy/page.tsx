export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Data Privacy & Governance</h1>
      <p className="max-w-3xl text-slate-600">
        NovaPilot AI operates on a foundation of radical data transparency and tenant isolation. Your operational data remains yours, exclusively synthesized to drive your strategic growth.
      </p>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">What we collect</h2>
        <ul className="mt-3 space-y-2">
          <li>Account data: name, email, authentication details.</li>
          <li>Workspace data: connectors, uploads, insights, and usage logs.</li>
          <li>Product analytics: feature usage and reliability metrics.</li>
        </ul>
      </section>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">How we use data</h2>
        <ul className="mt-3 space-y-2">
          <li>Deliver core product functionality.</li>
          <li>Protect workspace security and detect abuse.</li>
          <li>Improve onboarding, performance, and reliability.</li>
        </ul>
      </section>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">AI processing and trust</h2>
        <p className="mt-2">
          AI requests are processed to generate answers. We apply trust controls like confidence scoring, freshness, and
          citations so users can verify important outputs.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5 text-sm text-slate-700">
          <h3 className="text-base font-semibold text-slate-900">Retention and deletion</h3>
          <p className="mt-2">
            We retain data as long as your account is active. You can request export or deletion; deleted data is removed
            from active systems and backup retention expires on normal cycles.
          </p>
        </article>
        <article className="card p-5 text-sm text-slate-700">
          <h3 className="text-base font-semibold text-slate-900">Your rights</h3>
          <p className="mt-2">
            You can request access, correction, export, or deletion of personal data. Contact us anytime for privacy support.
          </p>
        </article>
      </section>
    </main>
  );
}
