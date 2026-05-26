import { createClient, createAdminClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export async function getCurrentMembership() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [membershipResult, profileResult] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("is_internal_tester")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  const membership = membershipResult.data;
  const profile = profileResult.data;
  const isAdmin = env.ADMIN_EMAILS.includes(user.email || "");
  const isTester = env.TESTER_EMAILS.includes(user.email || "");
  const isPrivileged = isAdmin || isTester || !!profile?.is_internal_tester;

  let finalMembership = membership;

  // Auto-provision only for privileged local development accounts.
  const canAutoProvision = process.env.NODE_ENV !== "production";
  if (!membership && isPrivileged) {
    if (!canAutoProvision) {
      return null;
    }
    console.log(`[TENANT] Auto-provisioning workspace for privileged user: ${user.email}`);
    const adminClient = await createAdminClient();

    const { data: newOrg, error: orgError } = await adminClient
      .from("organizations")
      .insert({
        name: `Dev Workspace (${user.email})`,
        slug: `dev-${user.id.slice(0, 8)}`,
      })
      .select()
      .single();

    if (newOrg) {
      const { data: newMember, error: memError } = await adminClient
        .from("organization_members")
        .insert({
          organization_id: newOrg.id,
          user_id: user.id,
          role: "admin",
        })
        .select()
        .single();
      
      if (newMember) {
        finalMembership = newMember;
        console.log(`[TENANT] Successfully provisioned org: ${newOrg.id}`);
      } else {
        console.error("[TENANT] Member insert failed:", memError);
      }
    } else {
      console.error("[TENANT] Organization insert failed:", orgError);
      return null;
    }
  }

  if (!finalMembership) {
    return null;
  }

  return {
    userId: user.id,
    organizationId: finalMembership?.organization_id || "00000000-0000-0000-0000-000000000000",
    role: finalMembership?.role || "team_member",
    isInternalTester: isTester || !!profile?.is_internal_tester,
  };
}
