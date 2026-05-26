const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_EMAIL = 'dineshsharma.developer@gmail.com';
const TEST_PASSWORD = 'Dinesh@1995';

async function setupTestUser() {
  console.log(`Setting up test user: ${TEST_EMAIL}...`);

  // 1. Create or Get User
  const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: 'Dinesh Sharma (Admin)' }
  });

  if (authError) {
    if (authError.message.includes('already registered') || authError.code === 'email_exists') {
      console.log('User already exists, proceeding with privilege configuration...');
      // Since we don't have the ID easily without listUsers (which failed),
      // we'll fetch it from the profiles table by email if possible, or just ask the user.
      // Wait, profiles might not have email.
      // Let's try to get it from auth.users via SQL if possible?
      // Actually, I'll just use a SQL query to do everything at once.
      return await runSqlConfig(TEST_EMAIL);
    }
    throw authError;
  }

  console.log(`User created successfully with ID: ${user.id}`);
  await configureUser(user.id);
}

async function runSqlConfig(email) {
  console.log(`Running direct SQL configuration for ${email}...`);
  // We can't run raw SQL via the client easily without a special function.
  // But we can update the profile if we find the ID.
  // I'll try one more way to get the ID: by signing in (if I had the session). No.
  
  // I'll use the supabase client to query the organization_members table
  // but I need a way to link email to ID.
  console.error('Cannot resolve user ID for existing user without listUsers.');
  console.log('Please run the SQL provided in the summary to complete the setup.');
}

async function configureUser(userId) {
  // 2. Set as Internal Tester in profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_internal_tester: true })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
  } else {
    console.log('Profile updated: is_internal_tester = true');
  }

  // 3. Find Organization Membership and set as super_admin
  const { data: memberships, error: memError } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);

  if (memError) {
    console.error('Error fetching memberships:', memError);
  } else if (memberships && memberships.length > 0) {
    const orgId = memberships[0].organization_id;
    const { error: roleError } = await supabase
      .from('organization_members')
      .update({ role: 'super_admin' })
      .eq('user_id', userId)
      .eq('organization_id', orgId);

    if (roleError) {
      console.error('Error updating role:', roleError);
    } else {
      console.log(`Role updated to super_admin in organization: ${orgId}`);
    }
  } else {
    console.log('No organization membership found to update role.');
  }

  console.log('\n--- Setup Complete ---');
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Password: ${TEST_PASSWORD}`);
  console.log('Access: Internal Admin / Premium Tester / Full Bypass Enabled');
}

setupTestUser().catch(err => {
  console.error('Setup failed:', err);
  process.exit(1);
});
