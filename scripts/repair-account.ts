import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function repair() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = "dineshsharma.developer@gmail.com";
  console.log(`Repairing account for: ${email}`);

  // 1. Get User ID by searching in profiles (safer than listUsers if listUsers is broken)
  const { data: profileSearch } = await supabase.from("profiles").select("id").limit(100);
  
  // Actually, we can't search profiles if we don't know the ID.
  // We'll try to signup again but handle the error to get the ID if possible, 
  // or use the auth admin to get a single user by email.
  
  const { data: { user }, error: getError } = await supabase.auth.admin.createUser({
      email,
      password: 'password123', // Doesn't matter if it exists
      email_confirm: true
  }).catch(e => ({ data: { user: null }, error: e }));

  // If user already exists, we might not get the user object back in the error.
  // So we'll try a different approach: Update the user which might reveal the ID or work if we have the email.
  
  console.log("Searching for user ID...");
  // We'll use an RPC or just try to insert into organization_members with a subquery if possible.
  // Since we can't do that easily, we'll try to find the user in auth.users via a raw SQL query if possible.
  
  // Wait! If the user exists, they must have a profile.
  // I'll try to update profiles where email matches if I had email in profiles, but I don't.
  
  // Let's try to get user by email using the proper admin method.
  const { data: userData, error: fetchError } = await supabase.auth.admin.listUsers();
  // If listUsers is 500, we have a problem.
  
  if (fetchError) {
      console.error("Fetch Error:", fetchError);
      // If we can't get the user ID, we can't fix their specific account easily without raw SQL.
  }
}

// Alternative: Create a NEW user with a different email to test if it works.
async function createTestUser() {
    const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const email = `test-${Date.now()}@example.com`;
  console.log(`Creating fresh test user: ${email}`);
  
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });

  if (error) {
      console.error("Test User Failed:", error);
      return;
  }

  const user = data.user!;
  console.log("Test User ID:", user.id);

  // Setup Org
  const { data: org } = await supabase.from("organizations").insert({ name: "Test Org", slug: `test-${user.id.slice(0, 8)}` }).select().single();
  if (org) {
      await supabase.from("organization_members").insert({ organization_id: org.id, user_id: user.id, role: 'super_admin' });
      console.log("Test User ready.");
  }
}

createTestUser();
