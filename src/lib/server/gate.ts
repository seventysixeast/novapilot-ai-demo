import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { PRICING_PLANS, PlanLimits } from "@/lib/billing/plans";

export type FeatureKey = keyof Omit<PlanLimits, "name" | "price" | "features" | "ai_queries" | "workspaces"> | "ai_queries" | "basic_analytics";

export async function checkFeatureAccess(feature: FeatureKey): Promise<{ allowed: boolean; reason?: string }> {
  const membership = await getCurrentMembership();
  if (!membership) return { allowed: false, reason: "No active session" };

  // Internal Testing Bypass
  if (membership.isInternalTester) {
    console.log(`[TEST MODE] Bypassing gate for feature: ${feature}`);
    return { allowed: true };
  }

  const supabase = await createClient();

  // 1. Get Subscription and Plan
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan_code, status")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  const planCode = subscription?.plan_code || "free";
  const plan = PRICING_PLANS[planCode] || PRICING_PLANS.basic;

  // 2. Check Plan Level Requirements
  if (feature === "ai_queries") {
    // Queries are metered, handled in Step 3
  } else if (feature === "basic_analytics") {
    // Everyone on Starter or above gets basic
    if (!plan) return { allowed: false, reason: "Upgrade to Starter to unlock analytics." };
  } else if (feature in plan) {
    const value = (plan as any)[feature];
    if (typeof value === "boolean" && !value) {
      const requiredPlan = feature === "exports" ? "Pro" : "Growth";
      return { 
        allowed: false, 
        reason: `The ${feature.replace("_", " ")} feature is available on the ${requiredPlan} plan.` 
      };
    }
  }

  // 3. Check Usage Quotas (for metered features)
  if (feature === "ai_queries") {
    const { data: quotaSuccess, error: quotaError } = await supabase.rpc("check_and_record_usage", {
      target_org_id: membership.organizationId,
      target_quota_name: "ai_queries",
      increment_amount: 1
    });

    if (quotaError || !quotaSuccess) {
      return { allowed: false, reason: "Monthly AI query quota exceeded. Upgrade to unlock more signals." };
    }
  }

  return { allowed: true };
}

export async function requireFeatureAccess(feature: FeatureKey) {
  const access = await checkFeatureAccess(feature);
  if (!access.allowed) {
    throw new Error(access.reason || "Access denied");
  }
}

export async function requireAIQuota() {
  return requireFeatureAccess("ai_queries");
}
