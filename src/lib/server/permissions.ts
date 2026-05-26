import { getCurrentMembership } from "./tenant";
import { createClient } from "@/lib/supabase/server";
import { PRICING_PLANS, PlanLimits } from "@/lib/billing/plans";

export type { PlanLimits };
export { PRICING_PLANS };

export type AppRole = 'super_admin' | 'admin' | 'manager' | 'team_member' | 'customer';

const ROLE_HIERARCHY: Record<AppRole, number> = {
  'super_admin': 100,
  'admin': 80,
  'manager': 60,
  'team_member': 40,
  'customer': 20
};

export async function checkPermission(requiredRole: AppRole) {
  const membership = await getCurrentMembership();
  if (!membership) return false;

  if (membership.isInternalTester) {
    return true;
  }
  
  const userRole = membership.role as AppRole;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/** Synchronous: resolves plan limits from a known plan code. */
export function getPlanLimits(planCode: string = "basic"): PlanLimits {
  return PRICING_PLANS[planCode] || PRICING_PLANS.basic;
}

/** Async: resolves plan limits for the currently authenticated user's org subscription. */
export async function getPlanLimitsForOrganization(): Promise<PlanLimits> {
  const membership = await getCurrentMembership();
  if (!membership) return PRICING_PLANS.basic;

  if (membership.isInternalTester) {
    return PRICING_PLANS.enterprise;
  }
  
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_code')
    .eq('organization_id', membership.organizationId)
    .maybeSingle();
    
  return PRICING_PLANS[subscription?.plan_code || 'basic'] || PRICING_PLANS.basic;
}

export async function canAccessFeature(featureName: keyof PlanLimits) {
  const membership = await getCurrentMembership();
  if (membership?.isInternalTester) {
    return true;
  }

  const limits = await getPlanLimitsForOrganization();
  if (typeof limits[featureName] === 'boolean') {
    return limits[featureName] as boolean;
  }
  return true;
}
