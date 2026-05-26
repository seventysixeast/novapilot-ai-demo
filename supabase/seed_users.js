const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000000';

const DEMO_USERS = [
  { 
    id: '11111111-1111-1111-1111-111111111111', 
    email: 'superadmin@novapilot.ai', 
    name: 'Alex Vance',
    role: 'super_admin',
    job_title: 'Chief Data Officer',
    bio: 'Driving enterprise-wide intelligence strategies.'
  },
  { 
    id: '22222222-2222-2222-2222-222222222222', 
    email: 'admin@novapilot.ai', 
    name: 'Jordan Smith',
    role: 'admin',
    job_title: 'Operations Director',
    bio: 'Optimizing scaling infrastructure.'
  },
  { 
    id: '33333333-3333-3333-3333-333333333333', 
    email: 'manager@novapilot.ai', 
    name: 'Sarah Chen',
    role: 'manager',
    job_title: 'Growth Lead',
    bio: 'Focused on high-velocity expansion.'
  },
  { 
    id: '44444444-4444-4444-4444-444444444444', 
    email: 'team@novapilot.ai', 
    name: 'Mike Ross',
    role: 'team_member',
    job_title: 'Senior Analyst',
    bio: 'Synthesizing complex data ecosystems.'
  },
  { 
    id: '55555555-5555-5555-5555-555555555555', 
    email: 'customer@novapilot.ai', 
    name: 'Elite Partner',
    role: 'customer',
    job_title: 'Strategic Client',
    bio: 'Enterprise-grade growth partner.'
  },
];

async function seedUsers() {
  console.log('🚀 Starting NovaPilot AI User Seeding (Admin API)...');
  
  for (const user of DEMO_USERS) {
    console.log(`Processing ${user.email}...`);
    
    // 1. Try to delete existing user to ensure fresh state
    await supabase.auth.admin.deleteUser(user.id).catch(() => {});

    // 2. Create the user
    const { data, error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        full_name: user.name,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name.split(' ')[0]}`
      }
    });

    if (error) {
      console.error(`❌ Error creating ${user.email}:`, error.message);
      continue;
    }

    console.log(`✅ Created ${user.email} (ID: ${data.user.id})`);

    // 3. Update Profile (The trigger handles creation, we update with details)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        job_title: user.job_title,
        bio: user.bio
      })
      .eq('id', user.id);
    
    if (profileError) console.error(`   ⚠️ Profile update failed:`, profileError.message);

    // 4. Join Organization (The trigger handles owner creation, but we ensure all join)
    const { error: memberError } = await supabase
      .from('organization_members')
      .upsert({
        organization_id: DEMO_ORG_ID,
        user_id: user.id,
        role: user.role
      }, { onConflict: 'organization_id,user_id' });

    if (memberError) console.error(`   ⚠️ Org membership failed:`, memberError.message);
  }

  // 5. Seed Additional User-Dependent Data (Notifications, Queries)
  console.log('\n📦 Seeding user-dependent data (Notifications, AI Queries)...');

  const sa1_id = DEMO_USERS[0].id;
  const ad1_id = DEMO_USERS[1].id;
  const mg1_id = DEMO_USERS[2].id;

  await supabase.from('notifications').insert([
    { organization_id: DEMO_ORG_ID, user_id: sa1_id, title: 'Intelligence Cycle Finalized', body: 'The Q3 revenue velocity analysis is now available for review.' },
    { organization_id: DEMO_ORG_ID, user_id: ad1_id, title: 'Security Protocol Verified', body: 'Quarterly data integrity audit completed.', is_read: true },
    { organization_id: DEMO_ORG_ID, user_id: mg1_id, title: 'Operational Anomaly Detected', body: 'Inbound lead response latency increased by 12%.' }
  ]);

  const thread1_id = '10000000-0000-0000-0000-000000000001';
  const thread2_id = '10000000-0000-0000-0000-000000000002';

  await supabase.from('chat_threads').upsert([
    { id: thread1_id, organization_id: DEMO_ORG_ID, created_by: sa1_id, title: 'Revenue Velocity Analysis' },
    { id: thread2_id, organization_id: DEMO_ORG_ID, created_by: ad1_id, title: 'Unit Economics Q2 Assessment' }
  ]);

  await supabase.from('ai_queries').insert([
    { organization_id: DEMO_ORG_ID, user_id: sa1_id, thread_id: thread1_id, query_text: 'Analyze the MRR acceleration observed 72 hours ago.', answer_text: 'The observed 400 MRR spike is directly attributed to three enterprise-tier conversions originating from the HubSpot "Scale Strategic" campaign. Confidence: 94%.', confidence_score: 94, freshness_status: 'fresh' },
    { organization_id: DEMO_ORG_ID, user_id: ad1_id, thread_id: thread2_id, query_text: 'Provide the current aggregate CAC.', answer_text: 'The weighted average Customer Acquisition Cost (CAC) across all verified channels is currently $38. Source: Marketing Spend API + Sales Attribution Hub.', confidence_score: 88, freshness_status: 'stale' }
  ]);

  console.log('\n✨ Seeding complete! All demo accounts and data are now active.');
}

seedUsers().catch(console.error);
