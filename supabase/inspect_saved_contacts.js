const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connections, error } = await supabase
    .from('data_connections')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'connected');

  if (error) {
    console.error('Error fetching connections:', error);
    return;
  }

  for (const conn of connections) {
    console.log(`Org: ${conn.organization_id}, Contacts Count: ${conn.metadata?.contacts?.length || 0}`);
    console.log('Contacts details:', JSON.stringify(conn.metadata?.contacts, null, 2));
  }
}

run();
