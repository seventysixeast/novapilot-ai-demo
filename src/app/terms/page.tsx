export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Master Service Agreement</h1>
      <p className="max-w-3xl text-slate-600">
        This agreement outlines the operational framework, licensing parameters, and strategic expectations for using the NovaPilot AI intelligence ecosystem.
      </p>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5 text-sm text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
          <ul className="mt-3 space-y-2">
            <li>No abuse, unauthorized access, or illegal usage.</li>
            <li>No harmful manipulation of AI outputs.</li>
            <li>Workspace owners manage who can access the account.</li>
          </ul>
        </article>
        <article className="card p-5 text-sm text-slate-700">
          <h2 className="text-lg font-semibold text-slate-900">AI limitations</h2>
          <ul className="mt-3 space-y-2">
            <li>AI outputs support decisions, but do not replace human judgment.</li>
            <li>Confidence and citation indicators should be reviewed for critical actions.</li>
            <li>Low-confidence responses may ask for clarification or provide safe fallback guidance.</li>
          </ul>
        </article>
      </section>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">Billing, trials, and refunds</h2>
        <p className="mt-2">
          Paid plans renew automatically. Annual plans are billed upfront. Trial and promotional credits follow plan terms.
          Refunds are handled fairly according to policy and local law.
        </p>
      </section>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">Limits and enforcement</h2>
        <p className="mt-2">
          Plans include usage limits (queries, connectors, members). If limits are reached, NovaPilot shows clear quota notices
          and upgrade options. We never hide usage state.
        </p>
      </section>

      <section className="card p-5 text-sm text-slate-700">
        <h2 className="text-lg font-semibold text-slate-900">Termination and support</h2>
        <p className="mt-2">
          Accounts may be suspended for severe abuse or security risk. You can cancel anytime. Support expectations depend on
          your plan tier.
        </p>
      </section>
    </main>
  );
}
