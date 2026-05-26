const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // We can query the information_schema or run a simple query to see if we can find tables.
  // Wait, let's query a known RPC or let's try some common table names
  const tables = [
    'organizations',
    'organization_members',
    'profiles',
    'data_connections',
    'sync_jobs',
    'analytics_metrics',
    'weekly_growth_reviews',
    'ai_settings',
    'ai_queries',
    'chat_threads',
    'chat_messages',
    'knowledge_chunks',
    'knowledge_documents'
  ];

  console.log('Testing table existence:');
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`❌ Table '${t}' does NOT exist.`);
    } else if (error) {
      console.log(`⚠️ Table '${t}' exists but returned error: ${error.message} (${error.code})`);
    } else {
      console.log(`✅ Table '${t}' EXISTS and is accessible!`);
    }
  }
}

run();
