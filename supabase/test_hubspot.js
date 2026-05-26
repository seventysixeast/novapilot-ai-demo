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
    .eq('provider', 'hubspot');

  if (error) {
    console.error('Error fetching connections:', error);
    return;
  }

  console.log(`Found ${connections.length} HubSpot connection(s).`);
  for (const conn of connections) {
    console.log(`Org ID: ${conn.organization_id}, Status: ${conn.status}`);
    const token = conn.metadata?.access_token;
    if (token) {
      console.log('Access token is present (truncated):', token.slice(0, 15) + '...');
      // Let's test calling HubSpot API to search for "amit"
      try {
        const hsResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'firstname',
                    operator: 'CONTAINS_TOKEN',
                    value: 'amit',
                  },
                ],
              },
            ],
            properties: ['firstname', 'lastname', 'email', 'city', 'lifecyclestage'],
            limit: 5,
          }),
        });

        if (hsResponse.ok) {
          const hsData = await hsResponse.json();
          console.log('HubSpot API Response (Amit Search):', JSON.stringify(hsData, null, 2));
        } else {
          const errText = await hsResponse.text();
          console.error(`HubSpot API error ${hsResponse.status}:`, errText);
        }
      } catch (e) {
        console.error('Fetch error:', e);
      }
    } else {
      console.log('No access token in metadata.');
    }
  }
}

run();
