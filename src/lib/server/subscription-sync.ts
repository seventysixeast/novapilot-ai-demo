import { createClient } from "@/lib/supabase/server";

export async function syncSubscriptionState(organizationId: string) {
  const supabase = await createClient();

  // Skip sync for internal testers
  const { data: member } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", organizationId)
    .limit(1)
    .single();
    
  if (member) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_internal_tester")
      .eq("id", member.user_id)
      .single();
      
    if (profile?.is_internal_tester) return;
  }

  // 1. Get current subscription and trial state
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, plan_code, status, current_period_end")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const { data: trial } = await supabase
    .from("trial_states")
    .select("status, ends_at")
    .eq("organization_id", organizationId)
    .maybeSingle();

  const now = new Date();

  // 2. Handle Trial Expiration
  if (trial && trial.status === "active" && new Date(trial.ends_at) < now) {
    // Trial expired, downgrade to basic
    await supabase.from("subscriptions").upsert({
      organization_id: organizationId,
      plan_code: "basic",
      status: "active",
      current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: "organization_id" });

    await supabase.from("trial_states").update({ status: "expired" }).eq("organization_id", organizationId);
    
    await supabase.from("notifications").insert({
      organization_id: organizationId,
      title: "Trial Expired",
      body: "Your 14-day Pro trial has concluded. Your workspace has been automatically moved to the Starter tier.",
    });
  }

  // 3. Handle Subscription Expiration (Non-trial)
  if (subscription && subscription.status === "active" && subscription.current_period_end) {
    if (new Date(subscription.current_period_end) < now) {
      const graceEndsAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("subscriptions")
        .update({ status: "past_due", current_period_end: graceEndsAt })
        .eq("organization_id", organizationId);

      await supabase.from("notifications").insert({
        organization_id: organizationId,
        title: "Payment requires attention",
        body: "We could not renew your subscription. You are in a 3-day grace period. Please update billing to avoid interruption.",
      });
    }
  }

  // 3b. Grace period expiration
  if (subscription && subscription.status === "past_due" && subscription.current_period_end) {
    if (new Date(subscription.current_period_end) < now) {
      await supabase
        .from("subscriptions")
        .update({
          status: "canceled",
          plan_code: "basic",
          cancel_at_period_end: false,
        })
        .eq("organization_id", organizationId);

      await supabase.from("notifications").insert({
        organization_id: organizationId,
        title: "Subscription paused",
        body: "Your grace period ended and premium access is paused. You can reactivate anytime from billing.",
      });
    }
  }

  // 4. Handle Quota Period Reset
  const { data: quotas } = await supabase
    .from("usage_quotas")
    .select("id, period_ends_at")
    .eq("organization_id", organizationId);

  if (quotas) {
    for (const quota of quotas) {
      if (new Date(quota.period_ends_at) < now) {
        // Reset usage for the new period
        await supabase.from("usage_quotas")
          .update({
            used: 0,
            period_ends_at: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq("id", quota.id);
      }
    }
  }
}
