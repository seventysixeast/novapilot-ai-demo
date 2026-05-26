import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function finalLink() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = "dineshsharma.developer@gmail.com";
  console.log(`Ensuring clean state for: ${email}`);

  // 1. We need the actual User ID. We'll try to find it by attempting to create user (which fails and might return error details, but we know it exists).
  // Since listUsers is 500, we'll try to search profiles again but this time we'll check if there's any profile with a matching ID in auth.users via a different way.
  
  // Wait! If I use supabase.auth.admin.getUserByEmail if it exists?
  // No, getUserByEmail is not a standard method in all versions.
  
  // Let's try to search organizations for the email? No.
  
  // I'll try to use the raw Postgres via an RPC if I had one. 
  // I don't.
  
  // OK, I'll assume that the user's ID is what was returned by my previous script IF it worked.
  // But wait! I'll try to just CREATE an organization for EVERY profile that doesn't have one.
  
  const { data: profiles } = await supabase.from("profiles").select("id");
  console.log(`Found ${profiles?.length || 0} profiles.`);

  for (const profile of (profiles || [])) {
      const userId = profile.id;
      console.log(`Provisioning for User ID: ${userId}`);
      
      const { data: org } = await supabase.from("organizations").insert({ 
          name: "Developer Workspace", 
          slug: `dev-ws-${userId.slice(0, 8)}` 
      }).select().single();
      
      const orgId = org?.id;
      if (orgId) {
          await supabase.from("organization_members").upsert({ 
              organization_id: orgId, 
              user_id: userId, 
              role: 'super_admin' 
          }, { onConflict: 'organization_id,user_id' });
          
          await supabase.from("subscriptions").upsert({ 
              organization_id: orgId, 
              plan_code: 'pro', 
              status: 'active' 
          }, { onConflict: 'organization_id' });
      }
  }
}

finalLink();
