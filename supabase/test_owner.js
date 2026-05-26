const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: connectors } = await supabase
    .from('data_connections')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('status', 'connected');

  const connector = connectors.find(c => c.organization_id === '99282dad-af28-457e-8503-f28c24e781e1') || connectors[0];
  const accessToken = connector.metadata?.access_token;

  // Let's call the Owners API
  const ownerId = '92638790';
  const response = await fetch(`https://api.hubapi.com/crm/v3/owners/${ownerId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.ok) {
    const ownerData = await response.json();
    console.log('HubSpot Owner API Response:', ownerData);
  } else {
    console.error('Owner API Error:', await response.text());
  }
}

run();
