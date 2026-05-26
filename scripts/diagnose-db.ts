import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function diagnose() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
  );

  const email = "dineshsharma.developer@gmail.com";
  console.log(`Diagnosing user: ${email}`);

  // 1. Get User
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.error("User not found!");
    return;
  }
  console.log(`User ID: ${user.id}`);

  // 2. Check Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Profile Error:", profileError);
    if (profileError.code === '42703') {
      console.log("Missing column: is_internal_tester. Attempting to fix...");
      // We can't easily add columns via JS client if it's not supported by RPC
    }
  } else {
    console.log("Profile:", profile);
  }

  // 3. Check Memberships
  const { data: memberships, error: memError } = await supabase
    .from("organization_members")
    .select("*, organizations(*)")
    .eq("user_id", user.id);

  if (memError) {
    console.error("Membership Error:", memError);
  } else {
    console.log(`Found ${memberships?.length || 0} memberships.`);
    memberships?.forEach(m => {
      console.log(`- Org: ${m.organizations?.name} (${m.organization_id}), Role: ${m.role}`);
    });
  }

  // 4. Try to create a test thread
  if (memberships && memberships.length > 0) {
    const orgId = memberships[0].organization_id;
    console.log(`Testing thread creation for org: ${orgId}`);
    const { data: thread, error: threadError } = await supabase
      .from("chat_threads")
      .insert({
        organization_id: orgId,
        created_by: user.id,
        title: "Diagnostic Thread",
      })
      .select()
      .single();

    if (threadError) {
      console.error("Thread Creation Test Failed:", threadError);
    } else {
      console.log("Thread Creation Test Succeeded:", thread.id);
      // Cleanup
      await supabase.from("chat_threads").delete().eq("id", thread.id);
    }
  } else {
    console.log("No organization found. Attempting to create one...");
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert({ name: "Dev Workspace", slug: `dev-${user.id.slice(0, 8)}` })
      .select()
      .single();
    
    if (orgError) {
      console.error("Org Creation Failed:", orgError);
    } else {
      console.log("Org Created:", newOrg.id);
      const { error: joinError } = await supabase
        .from("organization_members")
        .insert({ organization_id: newOrg.id, user_id: user.id, role: 'super_admin' });
      
      if (joinError) console.error("Join Failed:", joinError);
      else console.log("User joined org as super_admin");
    }
  }
}

diagnose();
