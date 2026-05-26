"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentMembership } from "@/lib/server/tenant";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export async function saveOnboardingRole(formData: FormData) {
  const roleTemplate = String(formData.get("role_template") ?? "founder");
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();
  const { error } = await supabase.from("onboarding_progress").upsert(
    {
      organization_id: membership.organizationId,
      role_template: roleTemplate,
      step_3_team: roleTemplate !== "solo",
    },
    { onConflict: "organization_id" },
  );
  if (error) {
    redirect(`/dashboard/onboarding?error=${encodeURIComponent("Unable to save role template right now. Please try again.")}`);
  }

  revalidatePath("/dashboard/onboarding");
  redirect("/dashboard/onboarding?message=Role template saved");
}

export async function completeOnboardingStep(formData: FormData) {
  const step = String(formData.get("step") ?? "");
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const stepKeyByAction: Record<string, "step_1_connected" | "step_2_queries" | "step_3_team"> = {
    connect: "step_1_connected",
    query: "step_2_queries",
    team: "step_3_team",
  };
  const stepKey = stepKeyByAction[step];
  if (!stepKey) redirect("/dashboard/onboarding?error=Invalid onboarding step");

  const supabase = await createClient();
  const payload: Record<string, boolean | string> = {
    organization_id: membership.organizationId,
    [stepKey]: true,
  };

  const { data: current } = await supabase
    .from("onboarding_progress")
    .select("step_1_connected, step_2_queries, step_3_team")
    .eq("organization_id", membership.organizationId)
    .maybeSingle();

  const completed =
    (stepKey === "step_1_connected" || current?.step_1_connected) &&
    (stepKey === "step_2_queries" || current?.step_2_queries) &&
    (stepKey === "step_3_team" || current?.step_3_team);
  payload.completed = Boolean(completed);

  await supabase.from("onboarding_progress").upsert(payload, { onConflict: "organization_id" });
  revalidatePath("/dashboard/onboarding");
  redirect("/dashboard/onboarding?message=Progress updated");
}

export async function bootstrapWorkspace() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await createAdminClient();
  const slug = `workspace-${user.id.slice(0, 8)}`;

  const { data: org } = await admin
    .from("organizations")
    .upsert(
      {
        slug,
        name: `${user.user_metadata?.full_name ?? "NovaPilot"} Workspace`,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();

  if (!org) {
    redirect("/dashboard/onboarding?error=Could not create workspace. Please contact support.");
  }

  await admin.from("organization_members").upsert(
    {
      organization_id: org.id,
      user_id: user.id,
      role: "admin",
    },
    { onConflict: "organization_id,user_id" },
  );

  await admin.from("onboarding_progress").upsert(
    {
      organization_id: org.id,
    },
    { onConflict: "organization_id" },
  );

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard/onboarding?message=Workspace created.");
}
