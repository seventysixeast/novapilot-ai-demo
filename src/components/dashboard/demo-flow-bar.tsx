import Link from "next/link";

const flow = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard?demo=1" },
  { id: "chat", label: "AI Chat", href: "/dashboard/chat?demo=1" },
  { id: "search", label: "AI Search", href: "/dashboard/search?demo=1" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics?demo=1" },
];

export function DemoFlowBar({ step }: { step: "dashboard" | "chat" | "search" | "analytics" }) {
  const currentIndex = flow.findIndex((item) => item.id === step);
  const next = flow[currentIndex + 1];

  return (
    <article className="card mb-4 flex flex-wrap items-center justify-between gap-3 p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
        {flow.map((item, idx) => (
          <span
            key={item.id}
            className={`rounded-full px-2.5 py-1 ${
              idx <= currentIndex ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
      {next ? (
        <Link
          href={next.href}
          className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-sky-500"
        >
          Next demo step
        </Link>
      ) : (
        <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
          Demo flow complete
        </span>
      )}
    </article>
  );
}
