export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-14">
      <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Contact & Sales</h1>
      <p className="text-slate-600">
        Founder-led demos, enterprise onboarding consultations, and security review support.
      </p>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="card p-5 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Request a demo</h2>
          <p className="mt-2">Share your team size, current stack, and growth goals. We will tailor a practical walkthrough.</p>
        </article>
        <article className="card p-5 text-sm text-slate-700">
          <h2 className="text-base font-semibold text-slate-900">Enterprise inquiry</h2>
          <p className="mt-2">For procurement, governance, and trust documentation workflows.</p>
        </article>
      </section>
      <div className="card p-4 text-sm text-slate-700">support@novapilot.ai • sales@novapilot.ai • security@novapilot.ai</div>
    </main>
  );
}
