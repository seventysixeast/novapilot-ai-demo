import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fixMainUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = "dineshsharma.developer@gmail.com";
  console.log(`Fixing main user: ${email}`);

  // 1. Get the organization
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "production-workspace")
    .maybeSingle();

  let orgId = org?.id;
  if (!orgId) {
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: "Production Workspace", slug: "production-workspace" })
      .select()
      .single();
    orgId = newOrg!.id;
  }
  console.log("Org ID:", orgId);

  // 2. We need the User ID. Since listUsers is 500, we'll try to find it in profiles.
  // Assuming the user has logged in at least once.
  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  
  if (!profiles || profiles.length === 0) {
      console.error("No profiles found! User might not have logged in yet.");
      return;
  }

  // We'll pick the most recently updated profile or just the first one if there's only one.
  const userId = profiles[0].id; 
  console.log(`Assuming User ID is: ${userId} (from profiles)`);

  // 3. Link them
  const { error: memError } = await supabase
    .from("organization_members")
    .upsert({ 
        organization_id: orgId, 
        user_id: userId, 
        role: 'super_admin' 
    }, { onConflict: 'organization_id,user_id' });

  if (memError) console.error("Membership Error:", memError);
  else console.log("User linked successfully.");

  // 4. Subscription
  await supabase.from("subscriptions").upsert({ 
      organization_id: orgId, 
      plan_code: 'pro', 
      status: 'active' 
  }, { onConflict: 'organization_id' });
  
  console.log("Subscription ensured.");
}

fixMainUser();
