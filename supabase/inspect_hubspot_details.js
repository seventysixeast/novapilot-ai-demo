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

  if (!connectors || connectors.length === 0) {
    console.error('No connected HubSpot connector found.');
    return;
  }

  // Use the user's active connector (second one in array or org matching 99282dad-af28-457e-8503-f28c24e781e1)
  const connector = connectors.find(c => c.organization_id === '99282dad-af28-457e-8503-f28c24e781e1') || connectors[0];
  const accessToken = connector.metadata?.access_token;

  console.log(`Querying HubSpot API for contact properties using Org: ${connector.organization_id}`);

  // Fetch contacts with detailed properties
  const hsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?properties=firstname,lastname,email,city,lifecyclestage,phone,hs_lead_status,hubspot_owner_id,createddate,lastmodifieddate', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (hsResponse.ok) {
    const hsData = await hsResponse.json();
    console.log('Full Contacts Data with details:', JSON.stringify(hsData.results, null, 2));
  } else {
    console.error('Failed to fetch details:', await hsResponse.text());
  }
}

run();
