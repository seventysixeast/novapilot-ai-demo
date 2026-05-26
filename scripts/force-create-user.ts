import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function forceCreateUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = "dineshsharma.developer@gmail.com";
  const password = "password123";

  console.log(`Force creating user: ${email}`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Dinesh Sharma" }
  });

  if (error) {
    console.error("Create User Error:", error);
    // If it already exists, that's fine too
    if (error.message.includes("already exists")) {
       console.log("User already exists, proceeding to setup...");
    } else {
        return;
    }
  } else {
    console.log("User created:", data.user!.id);
  }

  // Get user again to be sure
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
      console.error("User still not found after creation!");
      return;
  }

  // 1. Ensure Profile exists with the new column
  // We'll try to insert and catch errors about missing columns
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: "Dinesh Sharma" });

  if (profileError) {
      console.error("Profile Upsert Error:", profileError);
  } else {
      console.log("Profile ensured.");
  }

  // 2. Ensure Org exists
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: "Production Workspace", slug: "production-workspace" })
    .select()
    .single();

  let orgId;
  if (orgError) {
      if (orgError.message.includes("unique constraint")) {
          const { data: existingOrg } = await supabase.from("organizations").select("id").eq("slug", "production-workspace").single();
          orgId = existingOrg?.id;
      } else {
          console.error("Org Error:", orgError);
          return;
      }
  } else {
      orgId = org.id;
  }

  console.log("Using Org ID:", orgId);

  // 3. Ensure Membership as super_admin
  const { error: memError } = await supabase
    .from("organization_members")
    .upsert({ organization_id: orgId, user_id: user.id, role: 'super_admin' }, { onConflict: 'organization_id,user_id' });

  if (memError) console.error("Membership Error:", memError);
  else console.log("User is now super_admin of the org.");

  // 4. Ensure Subscription is active
  const { error: subError } = await supabase
    .from("subscriptions")
    .upsert({ organization_id: orgId, plan_code: 'pro', status: 'active' }, { onConflict: 'organization_id' });

  if (subError) console.error("Subscription Error:", subError);
  else console.log("Subscription is active.");
}

forceCreateUser();
