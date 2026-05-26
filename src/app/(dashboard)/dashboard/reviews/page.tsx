import { getCurrentMembership } from "@/lib/server/tenant";
import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const membership = await getCurrentMembership();
  const supabase = await createClient();

  let reviews: Array<{
    id: string;
    generated_for_week: string;
    summary: string;
    top_risk: string | null;
    top_win: string | null;
    recommended_action: string | null;
  }> = [];

  if (membership) {
    const { data } = await supabase
      .from("weekly_growth_reviews")
      .select("id, generated_for_week, summary, top_risk, top_win, recommended_action")
      .eq("organization_id", membership.organizationId)
      .order("generated_for_week", { ascending: false })
      .limit(8);
    reviews = (data ?? []) as typeof reviews;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Weekly growth reviews</h1>
        <p className="mt-1 text-slate-600">Recurring workflow to drive retention and executive clarity.</p>
      </div>

      <div className="grid gap-4">
        {reviews.length > 0 ? reviews.map((review) => (
          <article key={review.id} className="card space-y-3 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                Week of {new Date(review.generated_for_week).toLocaleDateString()}
              </h2>
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                Growth Review
              </span>
            </div>
            <p className="text-sm text-slate-700">{review.summary}</p>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                <span className="font-semibold block mb-1">Risk</span>
                {review.top_risk ?? "No major risk flagged."}
              </p>
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700">
                <span className="font-semibold block mb-1">Win</span>
                {review.top_win ?? "No win recorded."}
              </p>
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-sky-700">
                <span className="font-semibold block mb-1">Action</span>
                {review.recommended_action ?? "No action suggested yet."}
              </p>
            </div>
          </article>
        )) : (
          <div className="card p-8 text-center text-sm text-slate-500">
            No weekly reviews found. Try requesting an analysis in the Query Workspace.
          </div>
        )}
      </div>
    </section>
  );
}
