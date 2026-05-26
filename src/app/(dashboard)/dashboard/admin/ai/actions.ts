'use server';

import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/server/tenant";
import { revalidatePath } from "next/cache";

/**
 * Toggles internal tester status for the current admin.
 */
export async function toggleTesterStatus() {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== 'super_admin')) throw new Error("Unauthorized");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_internal_tester: !membership.isInternalTester })
    .eq("id", membership.userId);

  if (error) console.error("Failed to toggle tester status:", error);
  
  revalidatePath("/dashboard/admin/ai");
  revalidatePath("/dashboard/billing");
}

/**
 * Instantly switch the current organization's plan (for testing).
 */
export async function switchPlan(planCode: string) {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== 'super_admin')) throw new Error("Unauthorized");

  const supabase = await createClient();
  
  await supabase
    .from("subscriptions")
    .upsert({ 
      organization_id: membership.organizationId,
      plan_code: planCode,
      status: 'active',
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'organization_id' });

  revalidatePath("/dashboard/admin/ai");
  revalidatePath("/dashboard/billing");
}

/**
 * Reset usage quotas for the current organization.
 */
export async function resetQuotas() {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== 'super_admin')) throw new Error("Unauthorized");

  const supabase = await createClient();
  
  // Usage tracking is in ai_usage_logs or separate quota table. 
  // For now we'll just clear the logs for this org to simulate reset.
  await supabase
    .from("ai_usage_logs")
    .delete()
    .eq("organization_id", membership.organizationId);

  revalidatePath("/dashboard/admin/ai");
  revalidatePath("/dashboard/billing");
}

/**
 * Simulate trial expiration for the current organization.
 */
export async function expireTrial() {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== 'super_admin')) throw new Error("Unauthorized");

  const supabase = await createClient();
  
  await supabase
    .from("subscriptions")
    .update({ 
      status: 'past_due',
      current_period_end: new Date(Date.now() - 1000).toISOString()
    })
    .eq("organization_id", membership.organizationId);

  revalidatePath("/dashboard/admin/ai");
  revalidatePath("/dashboard/billing");
}

/**
 * Execute a synthetic AI request to verify routing health.
 */
export async function executeSyncTest() {
  const membership = await getCurrentMembership();
  if (!membership || (!membership.isInternalTester && membership.role !== 'super_admin')) throw new Error("Unauthorized");

  try {
    const { aiRouter } = await import("@/lib/ai/router");
    await aiRouter.generateCompletion(
      "Verify system integrity. Respond with 'NovaPilot Operational'.",
      "LIGHTWEIGHT"
    );
    revalidatePath("/dashboard/admin/ai");
    return { success: true };
  } catch (error) {
    console.error("AI Sync Test Failed:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
